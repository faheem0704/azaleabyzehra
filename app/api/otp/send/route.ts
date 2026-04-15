export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { generateOTP } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { contact: rawContact } = await req.json();

    if (!rawContact) {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
    }

    const isEmail = (rawContact as string).includes("@");

    // SMS is not available — phone users must use email for OTP verification
    if (!isEmail) {
      return NextResponse.json(
        { error: "OTP verification is only available via email. Please use your email address." },
        { status: 400 }
      );
    }

    // Normalise email to lowercase so OTP records match auth lookups
    const contact = (rawContact as string).trim().toLowerCase();

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

    await sendOTPEmail(contact, otp);

    // Always return success to prevent account enumeration
    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
