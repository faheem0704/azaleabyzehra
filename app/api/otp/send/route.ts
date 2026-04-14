export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { sendOTPSMS } from "@/lib/twilio";
import { generateOTP } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { contact: rawContact } = await req.json();

    if (!rawContact) {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
    }

    // BUG-20: normalise email to lowercase so OTP records match auth lookups
    const isEmail = (rawContact as string).includes("@");
    const contact = isEmail
      ? (rawContact as string).trim().toLowerCase()
      : (rawContact as string).trim();

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

    if (isEmail) {
      await sendOTPEmail(contact, otp);
    } else {
      await sendOTPSMS(contact, otp);
    }

    // BUG-33 (intentional): we always return success even if the contact doesn't exist
    // in the database. This prevents account enumeration — an attacker must not be able
    // to determine whether a given email/phone has a registered account by probing this
    // endpoint. The OTP simply won't match anything valid if the contact is unknown.
    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
