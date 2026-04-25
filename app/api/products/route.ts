import { NextRequest, NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const getCachedProducts = unstable_cache(
  async (params: {
    category: string;
    sort: string;
    colors: string;
    sizes: string;
    fabrics: string;
    minPrice: string;
    maxPrice: string;
    page: number;
    pageSize: number;
    search: string;
    featured: boolean;
    isNewArrival: boolean;
    isOnSale: boolean;
  }) => {
    const { category, sort, colors: colorsRaw, sizes: sizesRaw, fabrics: fabricsRaw, minPrice, maxPrice, page, pageSize, search, featured, isNewArrival, isOnSale } = params;
    const colors = colorsRaw ? colorsRaw.split(",").filter(Boolean) : [];
    const sizes = sizesRaw ? sizesRaw.split(",").filter(Boolean) : [];
    const fabrics = fabricsRaw ? fabricsRaw.split(",").filter(Boolean) : [];

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

    if (colors.length) where.colorFamilies = { hasSome: colors };
    if (sizes.length) where.sizes = { hasSome: sizes };
    if (fabrics.length) where.fabric = { in: fabrics };

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
    if (isOnSale) where.isOnSale = true;

    const isPopular = sort === "popular";
    const orderBy: Record<string, unknown> =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

    const productSelect = {
      id: true, name: true, slug: true, price: true,
      compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
      sizes: true, colors: true, fabric: true, stock: true,
      featured: true, isNewArrival: true, createdAt: true,
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      _count: { select: { reviews: true } },
    };

    let total: number;
    let products: any[];

    if (isPopular) {
      // Order by number of order items — Prisma relation count orderBy respects
      // all active WHERE filters and handles pagination correctly.
      [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          select: productSelect,
          orderBy: { orderItems: { _count: "desc" } },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
    } else {
      [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          // select only fields the listing page needs — avoids fetching description,
          // full category object, review bodies, etc.
          select: productSelect,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
    }

    return { products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
  ["products-list"],
  { tags: ["products"], revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const result = await getCachedProducts({
    category: searchParams.get("category") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    colors: searchParams.get("colors") ?? "",
    sizes: searchParams.get("sizes") ?? "",
    fabrics: searchParams.get("fabrics") ?? "",
    sort: searchParams.get("sort") || "newest",
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "12"),
    search: searchParams.get("search") ?? "",
    featured: searchParams.get("featured") === "true",
    isNewArrival: searchParams.get("isNewArrival") === "true",
    isOnSale: searchParams.get("isOnSale") === "true",
  });

  return NextResponse.json(
    { data: result.products, total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Fix 8: destructure only allowed fields — never spread raw body
  const {
    name, description, price, compareAtPrice,
    images, imageAlts, colorImages, categoryId,
    sizes, colors, colorFamilies, fabric, featured, isNewArrival, isOnSale, stock,
    variants,
  } = body;

  // Generate a unique slug, appending a suffix on collision
  let slug = slugify(name);
  const collision = await prisma.product.findUnique({ where: { slug } });
  if (collision) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    // Fix 1: create product and variants atomically in a single transaction
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name, description, price, compareAtPrice,
          images: images ?? [], imageAlts: imageAlts ?? [], colorImages,
          categoryId, sizes: sizes ?? [], colors: colors ?? [],
          colorFamilies: colorFamilies ?? [],
          fabric, featured: featured ?? false,
          isNewArrival: isNewArrival ?? false,
          isOnSale: isOnSale ?? false,
          stock: stock ?? 0,
          slug,
        },
      });

      if (variants && Array.isArray(variants) && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: { size: string; color: string; stock: number; sku?: string }) => ({
            productId: created.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            sku: v.sku?.trim().toUpperCase() || null,
          })),
        });
        // Sync product.stock to total of all variants
        const total = variants.reduce((s: number, v: { stock: number }) => s + v.stock, 0);
        const updated = await tx.product.update({ where: { id: created.id }, data: { stock: total } });
        return updated;
      }

      return created;
    });

    revalidateTag("products");
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A product with this name already exists" }, { status: 409 });
    }
    throw err;
  }
}
