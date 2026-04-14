export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { items, promoCode } = await req.json();

    // ── BUG-03: recalculate total server-side so Razorpay charge always
    //    matches the amount that POST /api/orders will also calculate. ──────
    const settings = await prisma.settings.findFirst().catch(() => null);
    const shippingFee = settings?.shippingFee ?? 199;
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 2999;

    const subtotal = (items as { price: number; quantity: number }[]).reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;

    let discount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode
        .findUnique({ where: { code: (promoCode as string).toUpperCase() } })
        .catch(() => null);

      if (
        promo &&
        promo.active &&
        (!promo.expiresAt || new Date() <= promo.expiresAt) &&
        (!promo.usageLimit || promo.usageCount < promo.usageLimit)
      ) {
        let eligible = subtotal;
        if (promo.productIds.length > 0) {
          eligible = (items as { productId: string; price: number; quantity: number }[])
            .filter((i) => promo.productIds.includes(i.productId))
            .reduce((s, i) => s + i.price * i.quantity, 0);
        }
        const raw = (eligible * promo.discountPercent) / 100;
        discount = Math.round(promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw);
      }
    }

    const total = Math.max(0, subtotal + shipping - discount);

    const order = await getRazorpay().orders.create({
      amount: Math.round(total * 100), // paise — matches server-recalculated total
      currency: "INR",
      receipt: `abz_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: total, // authoritative server-calculated amount
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
