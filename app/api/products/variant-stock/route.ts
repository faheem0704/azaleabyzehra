import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST body: { variants: [{ productId, size, color }] }
// Returns:   [{ productId, size, color, stock }]
// Falls back to product.stock when no variant record exists (untracked inventory).
export async function POST(req: NextRequest) {
  const { variants } = (await req.json()) as {
    variants: { productId: string; size: string; color: string }[];
  };

  if (!Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json([]);
  }

  // Single query — fetch all matching variant records at once
  const variantRecords = await prisma.productVariant.findMany({
    where: {
      OR: variants.map(({ productId, size, color }) => ({ productId, size, color })),
    },
    select: { productId: true, size: true, color: true, stock: true },
  });

  // Build a fast lookup map: "productId:size:color" → stock
  const variantMap = new Map(
    variantRecords.map((v) => [`${v.productId}:${v.size}:${v.color}`, v.stock])
  );

  // For items with no variant record, fall back to product-level stock
  const missingProductIds = Array.from(
    new Set(
      variants
        .filter(({ productId, size, color }) => !variantMap.has(`${productId}:${size}:${color}`))
        .map(({ productId }) => productId)
    )
  );

  const productStocks = missingProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: missingProductIds } },
        select: { id: true, stock: true },
      })
    : [];

  const productStockMap = new Map(productStocks.map((p) => [p.id, p.stock]));

  const results = variants.map(({ productId, size, color }) => {
    const key = `${productId}:${size}:${color}`;
    const stock = variantMap.has(key)
      ? variantMap.get(key)!
      : (productStockMap.get(productId) ?? 0);
    return { productId, size, color, stock };
  });

  return NextResponse.json(results);
}
