import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import MainLayout from "@/components/layout/MainLayout";
import ProductsPageClient from "@/components/products/ProductsPageClient";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Shop All",
  description: "Browse our full collection of premium Indian ethnic wear.",
};

const productSelect = {
  id: true, name: true, slug: true, price: true,
  compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
  description: true, colorFamilies: true, isOnSale: true,
  sizes: true, colors: true, fabric: true, stock: true,
  featured: true, isNewArrival: true, createdAt: true,
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  _count: { select: { reviews: true } },
} as const;

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
    search: string;
    featured: boolean;
    isNewArrival: boolean;
  }) => {
    const { category, sort, colors: colorsRaw, sizes: sizesRaw, fabrics: fabricsRaw, minPrice, maxPrice, page, search, featured, isNewArrival } = params;
    const colors = colorsRaw ? colorsRaw.split(",").filter(Boolean) : [];
    const sizes = sizesRaw ? sizesRaw.split(",").filter(Boolean) : [];
    const fabrics = fabricsRaw ? fabricsRaw.split(",").filter(Boolean) : [];
    const pageSize = 12;

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
        { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (featured) where.featured = true;
    if (isNewArrival) where.isNewArrival = true;

    const isPopular = sort === "popular";
    const orderBy: Record<string, unknown> =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      isPopular
        ? prisma.product.findMany({
            where,
            select: productSelect,
            orderBy: { orderItems: { _count: "desc" } },
            skip: (page - 1) * pageSize,
            take: pageSize,
          })
        : prisma.product.findMany({
            where,
            select: productSelect,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
    ]);

    return { products, total, totalPages: Math.ceil(total / pageSize) };
  },
  ["products-page"],
  { tags: ["products"], revalidate: 60 }
);

async function getProducts(params: {
  category: string;
  sort: string;
  colors: string[];
  sizes: string[];
  fabrics: string[];
  minPrice: string;
  maxPrice: string;
  page: number;
  search: string;
  featured: boolean;
  isNewArrival: boolean;
}) {
  try {
    return await getCachedProducts({
      ...params,
      colors: params.colors.join(","),
      sizes: params.sizes.join(","),
      fabrics: params.fabrics.join(","),
    });
  } catch {
    return null;
  }
}

interface ProductsPageProps {
  searchParams: {
    category?: string;
    sort?: string;
    colors?: string;
    sizes?: string;
    fabrics?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
    search?: string;
    featured?: string;
    isNewArrival?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "newest";
  const colors = searchParams.colors?.split(",").filter(Boolean) ?? [];
  const sizes = searchParams.sizes?.split(",").filter(Boolean) ?? [];
  const fabrics = searchParams.fabrics?.split(",").filter(Boolean) ?? [];
  const minPrice = searchParams.minPrice ?? "";
  const maxPrice = searchParams.maxPrice ?? "";
  const page = parseInt(searchParams.page ?? "1") || 1;
  const search = searchParams.search ?? "";
  const featured = searchParams.featured === "true";
  const isNewArrival = searchParams.isNewArrival === "true";

  const data = await getProducts({ category, sort, colors, sizes, fabrics, minPrice, maxPrice, page, search, featured, isNewArrival });

  return (
    <MainLayout>
      <Suspense fallback={<div className="pt-32 pb-24 section-padding"><div className="h-96 bg-ivory-200 animate-pulse" /></div>}>
        <ProductsPageClient
          initialProducts={data?.products ?? null}
          initialTotal={data?.total ?? null}
          initialTotalPages={data?.totalPages ?? null}
          initialPage={page}
        />
      </Suspense>
    </MainLayout>
  );
}
