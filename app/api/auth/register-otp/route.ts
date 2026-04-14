export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, contact, password, otp } = await req.json();

    if (!name?.trim() || !contact?.trim() || !password || !otp) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Validate OTP
    const otpRecord = await prisma.oTPRecord.findFirst({
      where: {
        contact: contact.trim(),
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Check duplicate before entering the transaction (fast-fail)
    const isEmail = contact.includes("@");
    const existing = await prisma.user.findFirst({
      where: isEmail ? { email: contact.trim() } : { phone: contact.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this contact already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // BUG-09: mark OTP used and create user atomically — if user creation
    // fails (e.g. concurrent registration race), the OTP is NOT consumed.
    await prisma.$transaction(async (tx) => {
      await tx.oTPRecord.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      await tx.user.create({
        data: {
          name: name.trim(),
          ...(isEmail ? { email: contact.trim() } : { phone: contact.trim() }),
          passwordHash,
        },
      });
    });

    return NextResponse.json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Register OTP error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
