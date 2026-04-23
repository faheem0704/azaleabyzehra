export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail, sendNewOrderAlert } from "@/lib/resend";
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
    const { items, address, selectedAddressId, paymentId, razorpayOrderId, paymentGateway, promoCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // Prevent paymentId reuse — one payment ID can only create one order
    if (paymentId) {
      const duplicate = await prisma.order.findFirst({
        where: { paymentId },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json({ error: "This payment has already been used" }, { status: 400 });
      }
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

    // ── Server-authoritative prices — NEVER trust client-sent prices ──────
    // Fetch actual prices from DB so a manipulated client payload cannot
    // change the order total or discount calculation.
    const productIds = Array.from(
      new Set((items as { productId: string }[]).map((i) => i.productId))
    );
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, slug: true },
    });
    const dbPriceMap = new Map(dbProducts.map((p) => [p.id, p.price]));
    const dbSlugMap = new Map(dbProducts.map((p) => [p.id, p.slug]));

    // Build authorizedItems — same shape as client items but with DB prices
    const authorizedItems = (
      items as { productId: string; quantity: number; size: string; color: string; price: number }[]
    ).map((item) => ({
      ...item,
      price: dbPriceMap.get(item.productId) ?? item.price, // fallback: product not found edge case
    }));

    // ── Subtotal & shipping ────────────────────────────────────────────────
    const subtotal = authorizedItems.reduce(
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
          eligibleSubtotal = authorizedItems
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
    // Batch-fetch all variants and products in two queries, then do zero DB
    // calls inside the loop (eliminates N+1 per cart item).
    const stockErrors: string[] = [];
    type VariantSnapshot = { id: string; stock: number; sku: string | null };
    const variantMap = new Map<string, VariantSnapshot>();

    // Batch fetch all relevant variants in one query
    const variantConditions = authorizedItems.map((item) => ({
      productId: item.productId,
      size: item.size,
      color: item.color,
    }));
    const allVariants = await prisma.productVariant.findMany({
      where: { OR: variantConditions },
      select: { id: true, productId: true, size: true, color: true, stock: true, sku: true },
    }).catch(() => [] as { id: string; productId: string; size: string; color: string; stock: number; sku: string | null }[]);

    for (const v of allVariants) {
      variantMap.set(`${v.productId}:${v.size}:${v.color}`, { id: v.id, stock: v.stock, sku: v.sku });
    }

    // Batch fetch all products by ID (for name lookup and no-variant stock check)
    const allProductIds = Array.from(new Set(authorizedItems.map((i) => i.productId)));
    const allProducts = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, name: true, stock: true },
    });
    const allProductMap = new Map(allProducts.map((p) => [p.id, p]));

    // For products without variant records, accumulate total qty across all sizes/colors
    // before checking — prevents oversell when multiple line items share the same product
    const noVariantQtyMap = new Map<string, number>(); // productId → total requested qty

    for (const item of authorizedItems) {
      const key = `${item.productId}:${item.size}:${item.color}`;
      const variant = variantMap.get(key) ?? null;

      if (variant) {
        if (variant.stock < item.quantity) {
          const prod = allProductMap.get(item.productId);
          stockErrors.push(
            `"${prod?.name ?? item.productId}" (${item.size} / ${item.color}) — only ${variant.stock} left in stock`
          );
        }
      } else {
        // Accumulate — check will happen after the loop
        noVariantQtyMap.set(item.productId, (noVariantQtyMap.get(item.productId) ?? 0) + item.quantity);
      }
    }

    // Check aggregate qty for products without variant records
    for (const [productId, totalQty] of Array.from(noVariantQtyMap)) {
      const prod = allProductMap.get(productId);
      if (prod && prod.stock < totalQty) {
        stockErrors.push(`"${prod.name}" — only ${prod.stock} left in stock`);
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
        status: paymentId ? "PROCESSING" : "PENDING",
        paymentId: paymentId || null,
        razorpayOrderId: razorpayOrderId || null,
        paymentStatus: paymentId ? "PAID" : "PENDING",
        paymentGateway: paymentGateway || null,
        items: {
          create: authorizedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price, // DB-authoritative price — not client-sent
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

    // ── Decrement stock — two-phase to avoid race condition ──────────────
    // Phase 1: update every variant stock in parallel (each targets a different row).
    // Phase 2: re-aggregate and sync product.stock per unique product AFTER all
    //          variants are settled — prevents concurrent writes to the same product
    //          row producing a wrong total when two variants of the same product
    //          are in the same order.

    // Phase 1: variant decrements (safe to parallelise — distinct rows)
    const updatedVariants = new Map<string, number>(); // key → new stock
    await Promise.all(
      authorizedItems.map(async (item) => {
        const key = `${item.productId}:${item.size}:${item.color}`;
        const variant = variantMap.get(key) ?? null;
        if (variant) {
          const newStock = Math.max(0, variant.stock - item.quantity);
          const updated = await prisma.productVariant
            .update({ where: { id: variant.id }, data: { stock: newStock } })
            .catch(() => null);
          if (updated) updatedVariants.set(key, updated.stock);
        }
        // Products without variants are handled in phase 2 using decrement
      })
    );

    // Phase 2: sync product.stock for every affected product (sequential per product)
    const uniqueProductIds = Array.from(new Set(authorizedItems.map((i) => i.productId)));

    // ── ISR revalidation — trigger fresh CDN page for each affected product ─
    for (const productId of uniqueProductIds) {
      const slug = dbSlugMap.get(productId);
      if (slug) revalidatePath(`/products/${slug}`);
    }
    for (const productId of uniqueProductIds) {
      const itemsForProduct = authorizedItems.filter((i) => i.productId === productId);
      const hasVariants = itemsForProduct.some((i) =>
        variantMap.has(`${i.productId}:${i.size}:${i.color}`)
      );

      if (hasVariants) {
        // Re-aggregate after all variant updates are complete
        const agg = await prisma.productVariant.aggregate({
          where: { productId },
          _sum: { stock: true },
        });
        await prisma.product
          .update({ where: { id: productId }, data: { stock: agg._sum.stock ?? 0 } })
          .catch(() => {});
      } else {
        // No variant records — decrement product.stock directly
        const totalQty = itemsForProduct.reduce((s, i) => s + i.quantity, 0);
        const prod = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
        const newStock = Math.max(0, (prod?.stock ?? 0) - totalQty);
        await prisma.product
          .update({ where: { id: productId }, data: { stock: newStock } })
          .catch(() => {});
      }
    }

    // Phase 3: low-stock alerts (non-blocking)
    if (adminEmail) {
      const { sendLowStockAlert } = await import("@/lib/resend");
      for (const item of authorizedItems) {
        const key = `${item.productId}:${item.size}:${item.color}`;
        const newStock = updatedVariants.get(key);
        if (newStock !== undefined && newStock <= lowStockThreshold) {
          const prod = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          sendLowStockAlert(adminEmail, {
            productName: prod?.name ?? item.productId,
            size: item.size,
            color: item.color,
            remaining: newStock,
          }).catch(console.error);
        }
      }
    }

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

    // Admin new-order notification
    if (adminEmail) {
      sendNewOrderAlert(adminEmail, {
        id: order.id,
        customerName: order.user?.name || order.user?.email || order.guestEmail || "Guest",
        customerContact: order.user?.email || order.user?.phone || "—",
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      }).catch(console.error);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
