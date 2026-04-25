export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/orders/[id]/exchange — swap size/color on a PENDING order item
// Atomically: decrement new variant stock, increment old variant stock, update order item
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orderItemId, newSize, newColor } = body as {
    orderItemId: string;
    newSize: string;
    newColor: string;
  };

  if (!orderItemId || !newSize?.trim() || !newColor?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch order and verify ownership + status
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "Size/color can only be changed on PENDING orders" },
      { status: 400 }
    );
  }

  const item = order.items.find((i) => i.id === orderItemId);
  if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });

  if (item.size === newSize.trim() && item.color === newColor.trim()) {
    return NextResponse.json(
      { error: "New size/color is the same as the current one" },
      { status: 400 }
    );
  }

  // Atomic swap with FOR UPDATE lock to prevent concurrent oversell.
  // The raw SELECT ... FOR UPDATE acquires row locks before we read stock,
  // so two concurrent exchanges for the last unit cannot both pass the check.
  try {
    await prisma.$transaction(async (tx) => {
      // Lock the relevant variant rows for this product
      await tx.$queryRaw`
        SELECT id FROM product_variants
        WHERE "productId" = ${item.productId}
          AND (
            (size = ${newSize.trim()} AND color = ${newColor.trim()})
            OR (size = ${item.size} AND color = ${item.color})
          )
        FOR UPDATE
      `;

      // Now read stock values — guaranteed fresh because of the lock above
      const newVariantRecord = await tx.productVariant.findUnique({
        where: { productId_size_color: { productId: item.productId, size: newSize.trim(), color: newColor.trim() } },
        select: { id: true, stock: true },
      });

      if (!newVariantRecord) {
        throw Object.assign(new Error("VARIANT_UNAVAILABLE"), {});
      }
      if (newVariantRecord.stock < item.quantity) {
        throw Object.assign(new Error("OUT_OF_STOCK"), { available: newVariantRecord.stock });
      }

      await tx.productVariant.update({
        where: { id: newVariantRecord.id },
        data: { stock: { decrement: item.quantity } },
      });

      const oldVariantRecord = await tx.productVariant.findUnique({
        where: { productId_size_color: { productId: item.productId, size: item.size, color: item.color } },
        select: { id: true },
      });

      if (oldVariantRecord) {
        await tx.productVariant.update({
          where: { id: oldVariantRecord.id },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { size: newSize.trim(), color: newColor.trim() },
      });

      // Re-sync product.stock inside the transaction so it's atomic with the variant updates
      const agg = await tx.productVariant.aggregate({
        where: { productId: item.productId },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: agg._sum.stock ?? 0 },
      });
    });
  } catch (err) {
    const e = err as Error & { available?: number };
    if (e.message === "VARIANT_UNAVAILABLE") {
      return NextResponse.json({ error: "This size/color combination is not available" }, { status: 400 });
    }
    if (e.message === "OUT_OF_STOCK") {
      return NextResponse.json(
        { error: `Only ${e.available} unit(s) in stock for this option` },
        { status: 400 }
      );
    }
    console.error("Exchange transaction error:", err);
    return NextResponse.json({ error: "Failed to exchange item" }, { status: 500 });
  }

  return NextResponse.json({ success: true, newSize: newSize.trim(), newColor: newColor.trim() });
}
