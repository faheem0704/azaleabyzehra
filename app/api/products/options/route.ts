import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns distinct sizes, colors, and fabrics from non-deleted products.
// Cached for 5 minutes — changes slowly, no need for ISR.
export const revalidate = 300;

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { sizes: true, colors: true, fabric: true },
  });

  const sizes = new Set<string>();
  const colors = new Set<string>();
  const fabrics = new Set<string>();

  for (const p of products) {
    p.sizes.forEach((s) => sizes.add(s));
    p.colors.forEach((c) => colors.add(c));
    if (p.fabric) fabrics.add(p.fabric);
  }

  return NextResponse.json({
    sizes: Array.from(sizes).sort(),
    colors: Array.from(colors).sort(),
    fabrics: Array.from(fabrics).sort(),
  });
}
