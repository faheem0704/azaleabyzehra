export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { contact, otp } = await req.json();

    if (!contact || !otp) {
      return NextResponse.json({ error: "Contact and OTP are required" }, { status: 400 });
    }

    // BUG-22: rate-limit verify attempts to prevent brute-force of 6-digit OTPs
    // (1,000,000 combinations — crackable in seconds without a limit)
    if (!checkRateLimit(`otp-verify:${contact}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    const record = await prisma.oTPRecord.findFirst({
      where: {
        contact,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
