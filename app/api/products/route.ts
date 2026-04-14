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

  if (colors?.length) {
    where.colors = { hasSome: colors };
  }

  if (sizes?.length) {
    where.sizes = { hasSome: sizes };
  }

  if (fabric) {
    where.fabric = { equals: fabric, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (featured) where.featured = true;
  if (isNewArrival) where.isNewArrival = true;

  const orderBy: Record<string, string> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "popular"
      ? { createdAt: "desc" }
      : { createdAt: "desc" };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { reviews: true } } },
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
  const product = await prisma.product.create({
    data: {
      ...body,
      slug: slugify(body.name),
    },
  });

  return NextResponse.json(product, { status: 201 });
}
