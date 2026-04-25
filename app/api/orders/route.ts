export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail, sendNewOrderAlert } from "@/lib/resend";
import { sendOrderConfirmationSMS } from "@/lib/twilio";
import { verifyPaymentToken } from "@/app/api/payment/verify/route";

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

    const userId = session.user.id; // capture before async closures lose the narrowing

    const body = await req.json();
    const { items, address, selectedAddressId, paymentId, paymentToken, razorpayOrderId, paymentGateway, promoCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // ── SECURITY: verify the server-issued payment token before trusting paymentId ──
    // Without this check an attacker can POST /api/orders with an arbitrary paymentId
    // string and receive a PROCESSING order with paymentStatus PAID for free.
    if (paymentId) {
      if (!paymentToken || !razorpayOrderId) {
        return NextResponse.json({ error: "Invalid payment authorization" }, { status: 400 });
      }
      if (!verifyPaymentToken(paymentToken, paymentId, razorpayOrderId)) {
        return NextResponse.json({ error: "Payment authorization is invalid or has expired" }, { status: 400 });
      }
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
        where: { id: selectedAddressId, userId },
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
      // Destructure only the known address fields — never spread the raw client
      // object, which could include arbitrary keys (e.g. id, isDefault).
      const { name: addrName, phone: addrPhone, line1, line2, city, state, pincode } = address as {
        name: string; phone: string; line1: string; line2?: string;
        city: string; state: string; pincode: string;
      };
      const addressRecord = await prisma.address.create({
        data: { name: addrName, phone: addrPhone, line1, line2: line2 || null, city, state, pincode, userId },
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

    // Reject if any product ID is not in the DB — never fall back to client-sent prices
    const unknownItem = (items as { productId: string }[]).find((i) => !dbPriceMap.has(i.productId));
    if (unknownItem) {
      return NextResponse.json({ error: "One or more items in your cart are no longer available" }, { status: 400 });
    }

    // Build authorizedItems — same shape as client items but with DB prices
    const authorizedItems = (
      items as { productId: string; quantity: number; size: string; color: string; price: number }[]
    ).map((item) => ({
      ...item,
      price: dbPriceMap.get(item.productId)!,
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

    // ── Atomic stock check + order create + stock decrement ──────────────
    // Everything runs inside a single serialisable transaction.  The variant
    // rows are locked with a raw SELECT ... FOR UPDATE so two concurrent
    // buyers of the last unit cannot both pass the stock check — one will
    // wait and then see stock = 0 and abort.
    type VariantSnapshot = { id: string; stock: number; sku: string | null };
    const variantMap = new Map<string, VariantSnapshot>();
    const updatedVariants = new Map<string, number>(); // key → new stock after decrement

    // Pre-fetch product names outside the tx (read-only, no lock needed)
    const allProductIds = Array.from(new Set(authorizedItems.map((i) => i.productId)));
    const allProducts = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, name: true, stock: true },
    });
    const allProductMap = new Map(allProducts.map((p) => [p.id, p]));

    const order = await prisma.$transaction(async (tx) => {
      // Lock and fetch all variant rows for the items in this order.
      // FOR UPDATE prevents another concurrent transaction from decrementing
      // the same variant until this transaction commits or rolls back.
      const variantConditions = authorizedItems.map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
      }));

      // Prisma doesn't expose FOR UPDATE natively; use $queryRaw for the lock.
      // We build a parameterised query selecting by (productId, size, color) tuples.
      // Fall back to a normal findMany if the raw query fails (non-PostgreSQL env).
      let lockedVariants: { id: string; productId: string; size: string; color: string; stock: number; sku: string | null }[] = [];
      try {
        // Build VALUES list: ($1,$2,$3), ($4,$5,$6), ...
        const params: string[] = [];
        const placeholders = variantConditions.map((_, idx) => {
          const base = idx * 3;
          params.push(variantConditions[idx].productId, variantConditions[idx].size, variantConditions[idx].color);
          return `($${base + 1},$${base + 2},$${base + 3})`;
        });
        lockedVariants = await tx.$queryRawUnsafe<typeof lockedVariants>(
          `SELECT id, "productId", size, color, stock, sku FROM product_variants
           WHERE ("productId", size, color) IN (${placeholders.join(",")})
           FOR UPDATE`,
          ...params
        );
      } catch {
        // Fallback (e.g. SQLite in tests): no row-level locking, best-effort
        lockedVariants = await tx.productVariant.findMany({
          where: { OR: variantConditions },
          select: { id: true, productId: true, size: true, color: true, stock: true, sku: true },
        });
      }

      for (const v of lockedVariants) {
        variantMap.set(`${v.productId}:${v.size}:${v.color}`, { id: v.id, stock: v.stock, sku: v.sku });
      }

      // Stock check — runs after acquiring locks so values are current
      const stockErrors: string[] = [];
      const noVariantQtyMap = new Map<string, number>();

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
          noVariantQtyMap.set(item.productId, (noVariantQtyMap.get(item.productId) ?? 0) + item.quantity);
        }
      }
      for (const [productId, totalQty] of Array.from(noVariantQtyMap)) {
        const prod = allProductMap.get(productId);
        if (prod && prod.stock < totalQty) {
          stockErrors.push(`"${prod.name}" — only ${prod.stock} left in stock`);
        }
      }
      if (stockErrors.length > 0) {
        // Throw so the transaction rolls back automatically
        throw Object.assign(new Error("OUT_OF_STOCK"), { stockErrors });
      }

      // Create order inside the transaction
      const createdOrder = await tx.order.create({
        data: {
          userId,
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
              price: item.price,
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

      // Decrement stock inside the same transaction — atomically with order creation
      for (const item of authorizedItems) {
        const key = `${item.productId}:${item.size}:${item.color}`;
        const variant = variantMap.get(key) ?? null;
        if (variant) {
          const newStock = Math.max(0, variant.stock - item.quantity);
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: newStock },
          });
          updatedVariants.set(key, newStock);
        }
      }

      // Sync product.stock for products with variants (aggregate inside tx)
      const uniqueProductIdsInTx = Array.from(new Set(authorizedItems.map((i) => i.productId)));
      for (const productId of uniqueProductIdsInTx) {
        const itemsForProduct = authorizedItems.filter((i) => i.productId === productId);
        const hasVariants = itemsForProduct.some((i) => variantMap.has(`${i.productId}:${i.size}:${i.color}`));
        if (hasVariants) {
          const agg = await tx.productVariant.aggregate({ where: { productId }, _sum: { stock: true } });
          await tx.product.update({ where: { id: productId }, data: { stock: agg._sum.stock ?? 0 } });
        } else {
          const totalQty = itemsForProduct.reduce((s, i) => s + i.quantity, 0);
          await tx.product.update({ where: { id: productId }, data: { stock: { decrement: totalQty } } });
        }
      }

      return createdOrder;
    }, {
      // Use Serializable isolation to prevent phantom reads on stock rows
      isolationLevel: "Serializable",
      timeout: 15000,
    }).catch((err: Error & { stockErrors?: string[] }) => {
      if (err.message === "OUT_OF_STOCK" && err.stockErrors) throw err;
      throw err;
    });

    // ── BUG-02: increment promo usage only after order is saved ────────────
    if (promoRecordId) {
      await prisma.promoCode
        .update({ where: { id: promoRecordId }, data: { usageCount: { increment: 1 } } })
        .catch(console.error);
    }

    const uniqueProductIds = Array.from(new Set(authorizedItems.map((i) => i.productId)));

    // ── ISR revalidation — trigger fresh CDN page for each affected product ─
    for (const productId of uniqueProductIds) {
      const slug = dbSlugMap.get(productId);
      if (slug) revalidatePath(`/products/${slug}`);
    }

    // Phase 3: low-stock alerts (non-blocking)
    if (adminEmail) {
      const { sendLowStockAlert } = await import("@/lib/resend");
      for (const item of authorizedItems) {
        const key = `${item.productId}:${item.size}:${item.color}`;
        const newStock = updatedVariants.get(key);
        if (newStock !== undefined && newStock <= lowStockThreshold) {
          const prod = allProductMap.get(item.productId);
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
  } catch (error: unknown) {
    const err = error as Error & { stockErrors?: string[] };
    if (err.message === "OUT_OF_STOCK" && err.stockErrors) {
      return NextResponse.json(
        { error: `Some items are out of stock:\n${err.stockErrors.join("\n")}` },
        { status: 409 }
      );
    }
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
