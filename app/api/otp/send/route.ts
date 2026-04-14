export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { sendOTPSMS } from "@/lib/twilio";
import { generateOTP } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { contact } = await req.json();

    if (!contact) {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
    }

    // Max 3 OTPs per contact per 10 minutes
    if (!checkRateLimit(`otp:${contact}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this contact
    await prisma.oTPRecord.updateMany({
      where: { contact, used: false },
      data: { used: true },
    });

    await prisma.oTPRecord.create({
      data: { contact, otp, expiresAt },
    });

    const isEmail = contact.includes("@");

    if (isEmail) {
      await sendOTPEmail(contact, otp);
    } else {
      await sendOTPSMS(contact, otp);
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
