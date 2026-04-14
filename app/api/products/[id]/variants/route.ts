export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/products/[id]/variants
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const variants = await prisma.productVariant.findMany({
    where: { productId: params.id },
    orderBy: [{ size: "asc" }, { color: "asc" }],
  });
  return NextResponse.json(variants);
}

// PUT /api/products/[id]/variants — bulk upsert all variants for a product
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variants } = await req.json() as {
    variants: { size: string; color: string; stock: number; sku?: string }[];
  };

  // Delete variants no longer in the list, upsert the rest
  const keys = variants.map((v) => `${v.size}||${v.color}`);
  await prisma.productVariant.deleteMany({
    where: {
      productId: params.id,
      NOT: {
        AND: variants.map((v) => ({ size: v.size, color: v.color })),
      },
    },
  });

  const upserted = await Promise.all(
    variants.map((v) =>
      prisma.productVariant.upsert({
        where: { productId_size_color: { productId: params.id, size: v.size, color: v.color } },
        update: { stock: v.stock, sku: v.sku ?? null },
        create: { productId: params.id, size: v.size, color: v.color, stock: v.stock, sku: v.sku ?? null },
      })
    )
  );

  // Sync product.stock to total of all variants
  const total = variants.reduce((s, v) => s + v.stock, 0);
  await prisma.product.update({ where: { id: params.id }, data: { stock: total } });

  // Suppress unused variable warning
  void keys;

  return NextResponse.json(upserted);
}
