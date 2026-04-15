export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const colors = searchParams.get("colors")?.split(",").filter(Boolean);
  const sizes = searchParams.get("sizes")?.split(",").filter(Boolean);
  const fabric = searchParams.get("fabric");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured") === "true";
  const isNewArrival = searchParams.get("isNewArrival") === "true";

  const where: Record<string, unknown> = { isDeleted: false };

  if (category) {
    const cat = await prisma.category.findFirst({
      where: { slug: category },
      include: { children: true },
    });
    if (cat) {
      const ids = [cat.id, ...cat.children.map((c: { id: string }) => c.id)];
      where.categoryId = { in: ids };
    }
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  if (colors?.length) where.colors = { hasSome: colors };
  if (sizes?.length) where.sizes = { hasSome: sizes };
  if (fabric) where.fabric = { equals: fabric, mode: "insensitive" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      // Allow searching by SKU (useful for admin reorder / inventory lookup)
      { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (featured) where.featured = true;
  if (isNewArrival) where.isNewArrival = true;

  // BUG-14: popular sort now orders by actual order-item count descending
  const orderBy: Record<string, unknown> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "popular"
      ? { orderItems: { _count: "desc" } }
      : { createdAt: "desc" };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      // select only fields the listing page needs — avoids fetching description,
      // full category object, review bodies, etc.
      select: {
        id: true, name: true, slug: true, description: true, price: true,
        compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
        sizes: true, colors: true, fabric: true, stock: true,
        featured: true, isNewArrival: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true, parentId: true } },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // BUG-08: generate a unique slug, appending a suffix on collision
  let slug = slugify(body.name);
  const collision = await prisma.product.findUnique({ where: { slug } });
  if (collision) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const product = await prisma.product.create({
      data: { ...body, slug },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A product with this name already exists" }, { status: 409 });
    }
    throw err;
  }
}
