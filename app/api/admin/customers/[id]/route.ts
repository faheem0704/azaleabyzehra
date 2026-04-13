import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  // Always clean up session-related data
  await prisma.$transaction([
    // Delete cart items first, then cart
    prisma.cartItem.deleteMany({ where: { cart: { userId: id } } }),
    prisma.cart.deleteMany({ where: { userId: id } }),
    // Wishlist
    prisma.wishlist.deleteMany({ where: { userId: id } }),
    // Reviews
    prisma.review.deleteMany({ where: { userId: id } }),
    // OTP records matching email or phone
    ...(user.email ? [prisma.oTPRecord.deleteMany({ where: { contact: user.email } })] : []),
    ...(user.phone ? [prisma.oTPRecord.deleteMany({ where: { contact: user.phone } })] : []),
  ]);

  if (user._count.orders === 0) {
    // No orders — safe to fully delete addresses and user
    await prisma.address.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  } else {
    // Has orders — anonymize to free up email/phone without breaking order records
    await prisma.user.update({
      where: { id },
      data: {
        email: null,
        phone: null,
        name: "[Deleted]",
        passwordHash: null,
      },
    });
  }

  return NextResponse.json({ success: true });
}
