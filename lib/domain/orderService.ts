import { prisma } from "@/lib/prisma";
import { PaymentGateway } from "@/src/generated/prisma/client";
import {
  sendOrderConfirmationEmail,
  sendNewOrderAlert,
  sendLowStockAlert,
} from "@/lib/resend";
import { sendOrderConfirmationSMS } from "@/lib/twilio";

// Minimal shape of the order returned by prisma.$transaction — typed to what this service actually uses.
// prisma.$transaction with { isolationLevel } loses TypeScript's include-relation inference,
// so we cast explicitly rather than depend on internal generated types.
type CreatedOrderResult = {
  id: string;
  totalAmount: number;
  guestEmail: string | null;
  user: { email: string | null; phone: string | null; name: string | null } | null;
  address: { name: string; line1: string; city: string; state: string; pincode: string };
  items: Array<{
    product: { name: string };
    quantity: number;
    price: number;
    size: string;
    color: string;
  }>;
};

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly stockErrors?: string[],
  ) {
    super(message);
    this.name = "OrderError";
  }
}

interface RawAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  size: string;
  color: string;
  price: number; // ignored — overwritten with DB price
}

export interface CreateOrderInput {
  userId: string;
  items: OrderItemInput[];
  address?: RawAddress;
  selectedAddressId?: string;
  paymentId?: string | null;
  razorpayOrderId?: string | null;
  paymentGateway?: string | null;
  promoCode?: string | null;
}

export async function createOrder(input: CreateOrderInput) {
  const {
    userId,
    items,
    address,
    selectedAddressId,
    paymentId,
    razorpayOrderId,
    paymentGateway,
    promoCode,
  } = input;

  // Prevent paymentId reuse — one payment ID can only create one order
  if (paymentId) {
    const duplicate = await prisma.order.findFirst({
      where: { paymentId },
      select: { id: true },
    });
    if (duplicate) {
      throw new OrderError("This payment has already been used", 400);
    }
  }

  // Settings (server-side, never trust client)
  const settings = await prisma.settings.findFirst().catch(() => null);
  const shippingFee = settings?.shippingFee ?? 199;
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 2999;
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;
  const adminEmail = settings?.adminEmail ?? null;

  // Address resolution with validation
  let resolvedAddressId: string;
  let resolvedAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };

  if (selectedAddressId) {
    const existing = await prisma.address.findFirst({
      where: { id: selectedAddressId, userId },
    });
    if (!existing) throw new OrderError("Invalid address selection", 400);
    resolvedAddressId = existing.id;
    resolvedAddress = existing;
  } else {
    if (
      !address?.name ||
      !address.phone ||
      !address.line1 ||
      !address.city ||
      !address.state ||
      !address.pincode
    ) {
      throw new OrderError("All address fields are required", 400);
    }
    if (!/^[6-9]\d{9}$/.test((address.phone as string).replace(/\s/g, ""))) {
      throw new OrderError("Enter a valid 10-digit Indian mobile number", 400);
    }
    if (!/^\d{6}$/.test((address.pincode as string).trim())) {
      throw new OrderError("Enter a valid 6-digit PIN code", 400);
    }
    // Destructure only known fields — never spread raw client object
    const { name: addrName, phone: addrPhone, line1, line2, city, state, pincode } = address;
    const addressRecord = await prisma.address.create({
      data: {
        name: addrName,
        phone: addrPhone,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        userId,
      },
    });
    resolvedAddressId = addressRecord.id;
    resolvedAddress = addressRecord;
  }

  // Server-authoritative prices — NEVER trust client-sent prices
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, slug: true },
  });
  const dbPriceMap = new Map(dbProducts.map((p) => [p.id, p.price]));
  const dbSlugMap = new Map(dbProducts.map((p) => [p.id, p.slug]));

  const unknownItem = items.find((i) => !dbPriceMap.has(i.productId));
  if (unknownItem) {
    throw new OrderError(
      "One or more items in your cart are no longer available",
      400,
    );
  }

  const authorizedItems = items.map((item) => ({
    ...item,
    price: dbPriceMap.get(item.productId)!,
  }));

  // Subtotal & shipping
  const subtotal = authorizedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;

  // Promo validation — capture ID, defer usageCount increment
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
        promo.maxDiscount
          ? Math.min(rawDiscount, promo.maxDiscount)
          : rawDiscount,
      );
      validatedPromoCode = promo.code;
      promoRecordId = promo.id;
    }
  }

  const finalTotal = Math.max(0, subtotal + shipping - validatedDiscount);

  // Atomic stock check + order create + stock decrement
  type VariantSnapshot = { id: string; stock: number; sku: string | null };
  const variantMap = new Map<string, VariantSnapshot>();
  const updatedVariants = new Map<string, number>();

  const allProductIds = Array.from(new Set(authorizedItems.map((i) => i.productId)));
  const allProducts = await prisma.product.findMany({
    where: { id: { in: allProductIds } },
    select: { id: true, name: true, stock: true },
  });
  const allProductMap = new Map(allProducts.map((p) => [p.id, p]));

  const order = await prisma.$transaction(
    async (tx) => {
      // Lock variant rows with FOR UPDATE to prevent concurrent overselling
      const variantConditions = authorizedItems.map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
      }));

      let lockedVariants: {
        id: string;
        productId: string;
        size: string;
        color: string;
        stock: number;
        sku: string | null;
      }[] = [];
      try {
        const params: string[] = [];
        const placeholders = variantConditions.map((_, idx) => {
          const base = idx * 3;
          params.push(
            variantConditions[idx].productId,
            variantConditions[idx].size,
            variantConditions[idx].color,
          );
          return `($${base + 1},$${base + 2},$${base + 3})`;
        });
        lockedVariants = await tx.$queryRawUnsafe<typeof lockedVariants>(
          `SELECT id, "productId", size, color, stock, sku FROM product_variants
           WHERE ("productId", size, color) IN (${placeholders.join(",")})
           FOR UPDATE`,
          ...params,
        );
      } catch {
        // Fallback for non-PostgreSQL environments (e.g. SQLite in tests)
        lockedVariants = await tx.productVariant.findMany({
          where: { OR: variantConditions },
          select: {
            id: true,
            productId: true,
            size: true,
            color: true,
            stock: true,
            sku: true,
          },
        });
      }

      for (const v of lockedVariants) {
        variantMap.set(`${v.productId}:${v.size}:${v.color}`, {
          id: v.id,
          stock: v.stock,
          sku: v.sku,
        });
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
              `"${prod?.name ?? item.productId}" (${item.size} / ${item.color}) — only ${variant.stock} left in stock`,
            );
          }
        } else {
          noVariantQtyMap.set(
            item.productId,
            (noVariantQtyMap.get(item.productId) ?? 0) + item.quantity,
          );
        }
      }
      for (const [productId, totalQty] of Array.from(noVariantQtyMap)) {
        const prod = allProductMap.get(productId);
        if (prod && prod.stock < totalQty) {
          stockErrors.push(`"${prod.name}" — only ${prod.stock} left in stock`);
        }
      }
      if (stockErrors.length > 0) {
        throw new OrderError("OUT_OF_STOCK", 409, stockErrors);
      }

      const VALID_GATEWAYS = ["RAZORPAY", "STRIPE"] as const;
      if (paymentGateway && !VALID_GATEWAYS.includes(paymentGateway as typeof VALID_GATEWAYS[number])) {
        throw new OrderError(`Invalid payment gateway: ${paymentGateway}`, 400);
      }

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
          paymentGateway: (paymentGateway as PaymentGateway) || null,
          items: {
            create: authorizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
              sku:
                variantMap.get(`${item.productId}:${item.size}:${item.color}`)
                  ?.sku ?? null,
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
      const uniqueProductIdsInTx = Array.from(
        new Set(authorizedItems.map((i) => i.productId)),
      );
      for (const productId of uniqueProductIdsInTx) {
        const itemsForProduct = authorizedItems.filter(
          (i) => i.productId === productId,
        );
        const hasVariants = itemsForProduct.some((i) =>
          variantMap.has(`${i.productId}:${i.size}:${i.color}`),
        );
        if (hasVariants) {
          const agg = await tx.productVariant.aggregate({
            where: { productId },
            _sum: { stock: true },
          });
          await tx.product.update({
            where: { id: productId },
            data: { stock: agg._sum.stock ?? 0 },
          });
        } else {
          const totalQty = itemsForProduct.reduce((s, i) => s + i.quantity, 0);
          await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: totalQty } },
          });
        }
      }

      // Increment promo usage atomically with order creation — prevents concurrent
      // last-use orders from both succeeding under Serializable isolation
      if (promoRecordId) {
        await tx.promoCode.update({
          where: { id: promoRecordId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return createdOrder;
    },
    { isolationLevel: "Serializable", timeout: 15000 },
  ) as unknown as CreatedOrderResult;

  // Slugs for ISR revalidation (handled by the route layer)
  const uniqueProductIds = Array.from(
    new Set(authorizedItems.map((i) => i.productId)),
  );
  const slugsToRevalidate = uniqueProductIds
    .map((id) => dbSlugMap.get(id))
    .filter((s): s is string => Boolean(s));

  // Low-stock alerts (non-blocking)
  if (adminEmail) {
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

  // Customer confirmation notifications (non-blocking)
  const contactEmail = order.user?.email;
  const contactPhone = order.user?.phone;
  const orderData = {
    id: order.id,
    items: order.items.map((i: CreatedOrderResult["items"][number]) => ({
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
  if (contactEmail)
    sendOrderConfirmationEmail(contactEmail, orderData).catch(console.error);
  if (contactPhone)
    sendOrderConfirmationSMS(contactPhone, order.id).catch(console.error);

  // Admin new-order notification (non-blocking)
  if (adminEmail) {
    sendNewOrderAlert(adminEmail, {
      id: order.id,
      customerName:
        order.user?.name || order.user?.email || order.guestEmail || "Guest",
      customerContact: order.user?.email || order.user?.phone || "—",
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    }).catch(console.error);
  }

  return { order, slugsToRevalidate };
}
