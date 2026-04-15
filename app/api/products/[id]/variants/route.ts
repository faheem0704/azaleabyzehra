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

  // Validate SKU uniqueness before touching the DB — each non-empty SKU must not
  // already exist on a DIFFERENT variant (i.e. different productId or size/color).
  const nonEmptySkus = variants.filter((v) => v.sku?.trim());
  for (const v of nonEmptySkus) {
    const normalizedSku = v.sku!.trim().toUpperCase();
    v.sku = normalizedSku; // normalise to uppercase in-place
    const conflict = await prisma.productVariant.findFirst({
      where: {
        sku: normalizedSku,
        NOT: {
          AND: [
            { productId: params.id },
            { size: v.size },
            { color: v.color },
          ],
        },
      },
      select: { id: true, productId: true, size: true, color: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `SKU "${normalizedSku}" is already assigned to another variant. SKUs must be globally unique.` },
        { status: 409 }
      );
    }
  }

  // BUG-19: was NOT { AND: [...] } which is always TRUE (deletes everything).
  // Correct logic: delete variants whose (size, color) pair is NOT in the new list.
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
      return NextResponse.json(
        { error: "One or more SKUs are already in use. SKUs must be globally unique." },
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
