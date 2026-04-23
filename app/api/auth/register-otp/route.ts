export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { name, contact, password, otp } = await req.json();

    if (!name?.trim() || !contact?.trim() || !password || !otp) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // BUG-20: normalise email to lowercase so it's consistent with auth lookups
    const isEmail = (contact as string).includes("@");
    const normalizedContact = isEmail
      ? (contact as string).trim().toLowerCase()
      : (contact as string).trim();

    // Validate OTP
    const otpRecord = await prisma.oTPRecord.findFirst({
      where: {
        contact: normalizedContact,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Check duplicate before entering the transaction (fast-fail)
    const existing = await prisma.user.findFirst({
      where: isEmail ? { email: normalizedContact } : { phone: normalizedContact },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this contact already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // BUG-09: mark OTP used and create user atomically
    await prisma.$transaction(async (tx) => {
      await tx.oTPRecord.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      await tx.user.create({
        data: {
          name: name.trim(),
          // BUG-20: store normalised contact (email lowercased)
          ...(isEmail ? { email: normalizedContact } : { phone: normalizedContact }),
          passwordHash,
        },
      });
    });

    if (isEmail) {
      sendWelcomeEmail(name.trim(), normalizedContact).catch(console.error);
    }

    return NextResponse.json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Register OTP error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
