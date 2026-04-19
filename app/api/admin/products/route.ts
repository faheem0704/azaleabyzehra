import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawPage = parseInt(searchParams.get("page") ?? "");
  const rawLimit = parseInt(searchParams.get("limit") ?? "");
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? PAGE_SIZE : rawLimit));
  const skip = (page - 1) * limit;

  const search = searchParams.get("search")?.trim() || "";
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status") || "";
  const minPrice = parseFloat(searchParams.get("minPrice") || "");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "");
  const sort = searchParams.get("sort") || "newest";

  // Build dynamic where clause
  const where: Parameters<typeof prisma.product.findMany>[0]["where"] = { isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status === "featured") {
    where.featured = true;
  } else if (status === "newArrival") {
    where.isNewArrival = true;
  } else if (status === "onSale") {
    where.isOnSale = true;
  } else if (status === "lowStock") {
    const settings = await prisma.settings.findFirst({ select: { lowStockThreshold: true } });
    const lowStockThreshold = settings?.lowStockThreshold ?? 5;
    where.stock = { gt: 0, lt: lowStockThreshold };
  }

  if (!isNaN(minPrice)) {
    where.price = { ...(where.price as object), gte: minPrice };
  }
  if (!isNaN(maxPrice)) {
    where.price = { ...(where.price as object), lte: maxPrice };
  }

  // Build orderBy
  const orderByMap: Record<string, Parameters<typeof prisma.product.findMany>[0]["orderBy"]> = {
    newest:    { createdAt: "desc" },
    oldest:    { createdAt: "asc" },
    priceAsc:  { price: "asc" },
    priceDesc: { price: "desc" },
    nameAsc:   { name: "asc" },
    nameDesc:  { name: "desc" },
    stockAsc:  { stock: "asc" },
    stockDesc: { stock: "desc" },
  };
  const orderBy = orderByMap[sort] ?? { createdAt: "desc" };

  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, slug: true, description: true, price: true,
        compareAtPrice: true, images: true, imageAlts: true, colorImages: true, categoryId: true,
        sizes: true, colors: true, fabric: true, stock: true,
        featured: true, isNewArrival: true, isOnSale: true, createdAt: true,
        category: { select: { id: true, name: true } },
        variants: {
          select: { id: true, size: true, color: true, stock: true, sku: true },
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    products,
    totalCount,
    hasMore: skip + products.length < totalCount,
  });
}
