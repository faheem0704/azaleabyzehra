export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If a password is already set, require the current password to change it
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
