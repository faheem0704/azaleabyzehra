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

  // Verify new variant exists and has sufficient stock
  const newVariant = await prisma.productVariant.findUnique({
    where: {
      productId_size_color: {
        productId: item.productId,
        size: newSize.trim(),
        color: newColor.trim(),
      },
    },
  });

  if (!newVariant) {
    return NextResponse.json(
      { error: "This size/color combination is not available" },
      { status: 400 }
    );
  }
  if (newVariant.stock < item.quantity) {
    return NextResponse.json(
      { error: `Only ${newVariant.stock} unit(s) in stock for this option` },
      { status: 400 }
    );
  }

  // Find the old variant to restore stock
  const oldVariant = await prisma.productVariant.findUnique({
    where: {
      productId_size_color: {
        productId: item.productId,
        size: item.size,
        color: item.color,
      },
    },
  });

  // Atomic swap: decrement new variant stock, restore old variant stock, update order item
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: newVariant.id },
      data: { stock: { decrement: item.quantity } },
    });

    if (oldVariant) {
      await tx.productVariant.update({
        where: { id: oldVariant.id },
        data: { stock: { increment: item.quantity } },
      });
    } else {
      // Fallback: old variant record missing — increment product-level stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.orderItem.update({
      where: { id: orderItemId },
      data: { size: newSize.trim(), color: newColor.trim() },
    });
  });

  // Re-sync product.stock to sum of all variant stocks
  const aggregate = await prisma.productVariant.aggregate({
    where: { productId: item.productId },
    _sum: { stock: true },
  });
  await prisma.product.update({
    where: { id: item.productId },
    data: { stock: aggregate._sum.stock ?? 0 },
  });

  return NextResponse.json({ success: true, newSize: newSize.trim(), newColor: newColor.trim() });
}
