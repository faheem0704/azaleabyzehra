import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Don't delete if referenced by an order
  const orderCount = await prisma.order.count({ where: { addressId: params.id } });
  if (orderCount > 0) {
    return NextResponse.json({ error: "Cannot delete — this address is used by an order" }, { status: 400 });
  }

  await prisma.address.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Set as default
  await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  const updated = await prisma.address.update({ where: { id: params.id }, data: { isDefault: true } });
  return NextResponse.json(updated);
}
