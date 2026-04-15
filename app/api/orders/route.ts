export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { sendOrderConfirmationSMS } from "@/lib/twilio";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (!isAdmin) {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    where.userId = session.user.id;
  }

  if (status) where.status = status;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, images: true, slug: true } } } },
        address: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
    }

    const body = await req.json();
    const { items, address, selectedAddressId, paymentId, paymentGateway, promoCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // ── Settings (server-side, never trust client) ─────────────────────────
    const settings = await prisma.settings.findFirst().catch(() => null);
    const shippingFee = settings?.shippingFee ?? 199;
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 2999;
    const lowStockThreshold = settings?.lowStockThreshold ?? 5;
    const adminEmail = settings?.adminEmail ?? null;

    // ── BUG-04 + BUG-05: address resolution with validation ───────────────
    let resolvedAddressId: string;
    let resolvedAddress: {
      name: string; phone: string; line1: string; line2: string | null;
      city: string; state: string; pincode: string;
    };

    if (selectedAddressId) {
      // Use an existing saved address — verify it belongs to this user
      const existing = await prisma.address.findFirst({
        where: { id: selectedAddressId, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Invalid address selection" }, { status: 400 });
      }
      resolvedAddressId = existing.id;
      resolvedAddress = existing;
    } else {
      // New address — validate phone + pincode before persisting
      if (!address?.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
        return NextResponse.json({ error: "All address fields are required" }, { status: 400 });
      }
      if (!/^[6-9]\d{9}$/.test((address.phone as string).replace(/\s/g, ""))) {
        return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
      }
      if (!/^\d{6}$/.test((address.pincode as string).trim())) {
        return NextResponse.json({ error: "Enter a valid 6-digit PIN code" }, { status: 400 });
      }
      const addressRecord = await prisma.address.create({
        data: { ...address, userId: session.user.id },
      });
      resolvedAddressId = addressRecord.id;
      resolvedAddress = addressRecord;
    }

    // ── Subtotal & shipping ────────────────────────────────────────────────
    const subtotal = (items as { price: number; quantity: number }[]).reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;

    // ── BUG-02: promo validation — capture ID, defer usageCount increment ─
    let validatedDiscount = 0;
    let validatedPromoCode: string | null = null;
    let promoRecordId: string | null = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (
        promo &&
        promo.active &&
        (!promo.expiresAt || new Date() <= promo.expiresAt) &&
        (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
        (!promo.minOrderAmount || subtotal >= promo.minOrderAmount)
      ) {
        let eligibleSubtotal = subtotal;
        if (promo.productIds.length > 0) {
          eligibleSubtotal = (items as { productId: string; price: number; quantity: number }[])
            .filter((i) => promo.productIds.includes(i.productId))
            .reduce((s, i) => s + i.price * i.quantity, 0);
        }
        const rawDiscount = (eligibleSubtotal * promo.discountPercent) / 100;
        validatedDiscount = Math.round(
          promo.maxDiscount ? Math.min(rawDiscount, promo.maxDiscount) : rawDiscount
        );
        validatedPromoCode = promo.code;
        promoRecordId = promo.id;
        // NOTE: usageCount is incremented AFTER the order is successfully created (BUG-02)
      }
    }

    const finalTotal = Math.max(0, subtotal + shipping - validatedDiscount);

    // ── BUG-01 + BUG-06: stock availability check before creating anything ─
    // Build a variant map here and reuse it for order creation + decrement —
    // avoids fetching the same variants a second time later.
    const stockErrors: string[] = [];
    type VariantSnapshot = { id: string; stock: number; sku: string | null };
    const variantMap = new Map<string, VariantSnapshot>();

    for (const item of items as { productId: string; quantity: number; size: string; color: string }[]) {
      const key = `${item.productId}:${item.size}:${item.color}`;
      const variant = await prisma.productVariant
        .findUnique({
          where: { productId_size_color: { productId: item.productId, size: item.size, color: item.color } },
          select: { id: true, stock: true, sku: true },
        })
        .catch(() => null);

      if (variant) {
        variantMap.set(key, variant);
        if (variant.stock < item.quantity) {
          const prod = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } });
          stockErrors.push(
            `"${prod?.name ?? item.productId}" (${item.size} / ${item.color}) — only ${variant.stock} left in stock`
          );
        }
      } else {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });
        if (prod && prod.stock < item.quantity) {
          stockErrors.push(`"${prod.name}" — only ${prod.stock} left in stock`);
        }
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        { error: `Some items are out of stock:\n${stockErrors.join("\n")}` },
        { status: 409 }
      );
    }

    // ── Create order ───────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount: finalTotal,
        discountAmount: validatedDiscount,
        promoCode: validatedPromoCode,
        addressId: resolvedAddressId,
        paymentId: paymentId || null,
        paymentStatus: paymentId ? "PAID" : "PENDING",
        paymentGateway: paymentGateway || null,
        items: {
          create: (items as {
            productId: string;
            quantity: number;
            size: string;
            color: string;
            price: number;
          }[]).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price,
            // Snapshot the SKU at order time — remains accurate even if variant SKU changes later
            sku: variantMap.get(`${item.productId}:${item.size}:${item.color}`)?.sku ?? null,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        address: true,
        user: true,
      },
    });

    // ── BUG-02: increment promo usage only after order is saved ────────────
    if (promoRecordId) {
      await prisma.promoCode
        .update({ where: { id: promoRecordId }, data: { usageCount: { increment: 1 } } })
        .catch(console.error); // Non-fatal — order already committed
    }

    // ── Decrement stock (BUG-15: floored at 0) ────────────────────────────
    // Reuse variantMap built during stock check — no second DB round-trip per item.
    await Promise.all(
      (items as { productId: string; quantity: number; size: string; color: string }[]).map(async (item) => {
        const variant = variantMap.get(`${item.productId}:${item.size}:${item.color}`) ?? null;

        if (variant) {
          const newStock = Math.max(0, variant.stock - item.quantity); // BUG-15: floor at 0
          const updated = await prisma.productVariant
            .update({ where: { id: variant.id }, data: { stock: newStock } })
            .catch(() => null);

          // Sync product-level stock to sum of all variants
          const agg = await prisma.productVariant.aggregate({
            where: { productId: item.productId },
            _sum: { stock: true },
          });
          await prisma.product
            .update({ where: { id: item.productId }, data: { stock: agg._sum.stock ?? 0 } })
            .catch(() => {});

          // Low-stock alert
          if (updated && updated.stock <= lowStockThreshold && adminEmail) {
            const prod = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { name: true },
            });
            const { sendLowStockAlert } = await import("@/lib/resend");
            sendLowStockAlert(adminEmail, {
              productName: prod?.name ?? item.productId,
              size: item.size,
              color: item.color,
              remaining: updated.stock,
            }).catch(console.error);
          }
        } else {
          const prod = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          const newStock = Math.max(0, (prod?.stock ?? 0) - item.quantity); // BUG-15: floor at 0
          await prisma.product
            .update({ where: { id: item.productId }, data: { stock: newStock } })
            .catch(() => {});
        }
      })
    );

    // ── Confirmation notifications ─────────────────────────────────────────
    const contactEmail = order.user?.email;
    const contactPhone = order.user?.phone;

    const orderData = {
      id: order.id,
      items: order.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
      })),
      totalAmount: order.totalAmount,
      address: {
        name: resolvedAddress.name,
        line1: resolvedAddress.line1,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
        pincode: resolvedAddress.pincode,
      },
    };

    if (contactEmail) await sendOrderConfirmationEmail(contactEmail, orderData).catch(console.error);
    if (contactPhone) await sendOrderConfirmationSMS(contactPhone, order.id).catch(console.error);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
