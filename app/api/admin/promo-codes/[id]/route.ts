export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  // BUG-31: allow full promo code updates, not just toggling active
  const updateData: Record<string, unknown> = {};
  if (data.active !== undefined) updateData.active = data.active;
  if (data.code !== undefined) updateData.code = (data.code as string).toUpperCase().trim();
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = Number(data.discountValue);
  if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount != null ? Number(data.minOrderAmount) : null;
  if (data.maxUses !== undefined) updateData.maxUses = data.maxUses != null ? Number(data.maxUses) : null;
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  const promo = await prisma.promoCode.update({
    where: { id: params.id },
    data: updateData,
  });
  return NextResponse.json(promo);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.promoCode.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
