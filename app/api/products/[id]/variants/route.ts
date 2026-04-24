export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/products/[id]/variants
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const variants = await prisma.productVariant.findMany({
    where: { productId: params.id },
    orderBy: [{ size: "asc" }, { color: "asc" }],
  });

  // SKUs are internal identifiers — only expose to admins
  if (!isAdmin) {
    return NextResponse.json(variants.map(({ sku: _sku, ...v }) => v));
  }
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

  // Fix 6: validate no negative stock values
  const hasNegativeStock = variants.some((v) => v.stock < 0);
  if (hasNegativeStock) {
    return NextResponse.json(
      { error: "Stock values cannot be negative." },
      { status: 400 }
    );
  }

  // Normalize SKUs in-place (Fix 10: removed sequential pre-check loop — rely on DB @@unique constraint)
  for (const v of variants) {
    if (v.sku?.trim()) {
      v.sku = v.sku.trim().toUpperCase();
    }
  }

  // Delete variants whose (size, color) pair is NOT in the new list.
  await prisma.productVariant.deleteMany({
    where: {
      productId: params.id,
      NOT: {
        OR: variants.map((v) => ({ size: v.size, color: v.color })),
      },
    },
  });

  let upserted;
  try {
    upserted = await Promise.all(
      variants.map((v) =>
        prisma.productVariant.upsert({
          where: { productId_size_color: { productId: params.id, size: v.size, color: v.color } },
          update: { stock: v.stock, sku: v.sku?.trim().toUpperCase() || null },
          create: { productId: params.id, size: v.size, color: v.color, stock: v.stock, sku: v.sku?.trim().toUpperCase() || null },
        })
      )
    );
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target = err.meta?.target;
      return NextResponse.json(
        { error: `SKU conflict on field(s): ${Array.isArray(target) ? target.join(", ") : target}. SKUs must be globally unique.` },
        { status: 409 }
      );
    }
    throw err;
  }

  // Sync product.stock to total of all variants
  const total = variants.reduce((s, v) => s + v.stock, 0);
  await prisma.product.update({ where: { id: params.id }, data: { stock: total } });

  return NextResponse.json(upserted);
}
