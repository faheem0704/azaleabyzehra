export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function adminOnly(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { role?: string })?.role !== "ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (adminOnly(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(promoCodes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (adminOnly(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, discountPercent, maxDiscount, minOrderAmount, productIds, active, expiresAt, usageLimit } = await req.json();

  if (!code?.trim() || !discountPercent) {
    return NextResponse.json({ error: "Code and discount percent are required" }, { status: 400 });
  }
  if (discountPercent < 1 || discountPercent > 100) {
    return NextResponse.json({ error: "Discount percent must be between 1 and 100" }, { status: 400 });
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (existing) return NextResponse.json({ error: "A promo code with this name already exists" }, { status: 409 });

  const promo = await prisma.promoCode.create({
    data: {
      code: code.trim().toUpperCase(),
      discountPercent: parseInt(discountPercent),
      maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
      minOrderAmount: minOrderAmount ? parseInt(minOrderAmount) : null,
      productIds: productIds ?? [],
      active: active ?? true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
    },
  });

  return NextResponse.json(promo, { status: 201 });
}
