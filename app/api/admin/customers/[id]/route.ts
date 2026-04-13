import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  // Step 1: Immediately free up email/phone so they can re-register.
  // Do this first — it's the most important outcome.
  await prisma.user.update({
    where: { id },
    data: { email: null, phone: null, name: "[Deleted]", passwordHash: null },
  });

  // Step 2: Clean up OTP records
  if (user.email) await prisma.oTPRecord.deleteMany({ where: { contact: user.email } }).catch(() => {});
  if (user.phone) await prisma.oTPRecord.deleteMany({ where: { contact: user.phone } }).catch(() => {});

  // Step 3: Nullify userId on any orders so we can safely clean up
  await prisma.order.updateMany({ where: { userId: id }, data: { userId: null } }).catch(() => {});

  // Step 4: Try to fully delete the user record and related data
  try {
    await prisma.cartItem.deleteMany({ where: { cart: { userId: id } } });
    await prisma.cart.deleteMany({ where: { userId: id } });
    await prisma.wishlist.deleteMany({ where: { userId: id } });
    await prisma.review.deleteMany({ where: { userId: id } });
    await prisma.address.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  } catch {
    // Full delete failed (FK constraints) but email is already freed — that's fine
  }

  return NextResponse.json({ success: true });
}
