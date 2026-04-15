export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    // Max 10 promo attempts per IP per minute
    if (!checkRateLimit(`promo:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { code, items, subtotal } = await req.json();
    // items: { productId: string; price: number; quantity: number }[]

    if (!code?.trim()) {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo) return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    if (!promo.active) return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 });
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
    }
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      return NextResponse.json({
        error: `Minimum order of ₹${promo.minOrderAmount.toLocaleString("en-IN")} required for this code`,
      }, { status: 400 });
    }

    // Calculate eligible subtotal (all items if productIds is empty, else only matching)
    let eligibleSubtotal = subtotal;
    if (promo.productIds.length > 0 && Array.isArray(items)) {
      eligibleSubtotal = items
        .filter((i: { productId: string }) => promo.productIds.includes(i.productId))
        .reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);

      if (eligibleSubtotal === 0) {
        return NextResponse.json({ error: "No items in your cart are eligible for this promo code" }, { status: 400 });
      }
    }

    const rawDiscount = (eligibleSubtotal * promo.discountPercent) / 100;
    const discountAmount = promo.maxDiscount
      ? Math.min(rawDiscount, promo.maxDiscount)
      : rawDiscount;

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      maxDiscount: promo.maxDiscount,
      minOrderAmount: promo.minOrderAmount ?? null,
      productIds: promo.productIds, // needed for client-side discount recalculation on cart changes
      discountAmount: Math.round(discountAmount),
      message: promo.maxDiscount
        ? `${promo.discountPercent}% off (up to ₹${promo.maxDiscount.toLocaleString("en-IN")})`
        : `${promo.discountPercent}% off`,
    });
  } catch (error) {
    console.error("Promo validate error:", error);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
