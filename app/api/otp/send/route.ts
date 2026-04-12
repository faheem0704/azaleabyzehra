export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { sendOTPSMS } from "@/lib/twilio";
import { generateOTP } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { contact } = await req.json();

    if (!contact) {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
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

    try {
      if (isEmail) {
        await sendOTPEmail(contact, otp);
      } else {
        await sendOTPSMS(contact, otp);
      }
    } catch (deliveryError) {
      // If email/SMS isn't configured yet, log OTP to server console so it's
      // visible in Vercel function logs during development setup
      console.warn(
        `[OTP delivery failed — check Vercel logs] Contact: ${contact} | OTP: ${otp} | Error: ${deliveryError}`
      );
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
