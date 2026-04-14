export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: return the user's wishlist product IDs + product data
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ productIds: [] });

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  });

  if (!wishlist || wishlist.productIds.length === 0) {
    return NextResponse.json({ productIds: [] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: wishlist.productIds }, isDeleted: false },
    select: { id: true, name: true, images: true, price: true, compareAtPrice: true, slug: true, sizes: true, colors: true, stock: true },
  });

  return NextResponse.json({ productIds: wishlist.productIds, products });
}

// PUT: replace server wishlist with the client's local state
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productIds } = await req.json() as { productIds: string[] };

  await prisma.wishlist.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, productIds },
    update: { productIds },
  });

  return NextResponse.json({ ok: true });
}
