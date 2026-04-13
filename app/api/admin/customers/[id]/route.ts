import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "ADMIN") return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

    // Delete session-related data sequentially
    await prisma.cartItem.deleteMany({ where: { cart: { userId: id } } });
    await prisma.cart.deleteMany({ where: { userId: id } });
    await prisma.wishlist.deleteMany({ where: { userId: id } });
    await prisma.review.deleteMany({ where: { userId: id } });
    if (user.email) await prisma.oTPRecord.deleteMany({ where: { contact: user.email } });
    if (user.phone) await prisma.oTPRecord.deleteMany({ where: { contact: user.phone } });

    if (user._count.orders === 0) {
      // No orders — safe to fully delete
      await prisma.address.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { id } });
    } else {
      // Has orders — anonymize to free up email/phone without breaking order records
      await prisma.user.update({
        where: { id },
        data: { email: null, phone: null, name: "[Deleted]", passwordHash: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete customer error:", err);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
