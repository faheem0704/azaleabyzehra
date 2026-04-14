import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) || [];
  if (ids.length === 0) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: { id: { in: ids.slice(0, 8) }, isDeleted: false },
    include: { category: true },
  });

  // Return in the same order as the ids array
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  return NextResponse.json(ordered);
}
