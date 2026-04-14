export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: return the user's saved cart items
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, price: true, slug: true, sizes: true, colors: true, stock: true } },
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
    items: { productId: string; quantity: number; size: string; color: string; price: number }[];
  };

  // Upsert cart record
  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  // Delete existing items and re-create (simplest merge strategy)
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  if (items.length > 0) {
    await prisma.cartItem.createMany({
      data: items.map((i) => ({
        cartId: cart.id,
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true });
}
