export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: return the user's saved cart items (BUG-16: excludes soft-deleted products)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        // BUG-16: filter out items whose product has been soft-deleted
        where: { product: { isDeleted: false } },
        include: {
          product: {
            select: {
              id: true, name: true, images: true, price: true,
              slug: true, sizes: true, colors: true, stock: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ items: cart?.items ?? [] });
}

// PUT: replace server cart with the client's local state (called on merge)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json() as {
    items: { productId: string; quantity: number; size: string; color: string }[];
  };

  // Re-fetch prices from DB — never trust client-sent prices
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isDeleted: false },
    select: { id: true, price: true },
  });
  const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]));

  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const validItems = items.filter((i) => priceMap.has(i.productId));
  if (validItems.length > 0) {
    await prisma.cartItem.createMany({
      data: validItems.map((i) => ({
        cartId: cart.id,
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        price: priceMap.get(i.productId)!,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true });
}
