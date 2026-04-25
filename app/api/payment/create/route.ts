export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to proceed with payment" }, { status: 401 });
  }

  try {
    const { items, promoCode } = await req.json();

    const settings = await prisma.settings.findFirst().catch(() => null);
    const shippingFee = settings?.shippingFee ?? 199;
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 2999;

    // Fetch DB prices — never trust client-sent prices.
    // A manipulated cart could otherwise pay ₹1 and receive a PAID order.
    const productIds = Array.from(
      new Set((items as { productId: string }[]).map((i) => i.productId))
    );
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });
    const dbPriceMap = new Map(dbProducts.map((p) => [p.id, p.price]));

    const authorizedItems = (items as { productId: string; quantity: number }[]).map((item) => ({
      ...item,
      price: dbPriceMap.get(item.productId) ?? 0,
    }));

    const subtotal = authorizedItems.reduce((s, i) => s + i.price * i.quantity, 0);
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
        (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
        (!promo.minOrderAmount || subtotal >= promo.minOrderAmount)
      ) {
        let eligible = subtotal;
        if (promo.productIds.length > 0) {
          eligible = authorizedItems
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
      amount: total,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
