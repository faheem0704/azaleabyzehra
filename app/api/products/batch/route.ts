import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(`batch:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) || [];
  if (ids.length === 0) return NextResponse.json([]);

  // BUG-16: raised limit from 8 → 50 to support full cart validation
  const products = await prisma.product.findMany({
    where: { id: { in: ids.slice(0, 50) }, isDeleted: false },
    select: { id: true, name: true, price: true, images: true, slug: true, sizes: true, colors: true, stock: true },
  });

  // Return in the same order as the ids array
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  return NextResponse.json(ordered);
}
