import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import MainLayout from "@/components/layout/MainLayout";
import ProductsPageClient from "@/components/products/ProductsPageClient";
import ProductsLoading from "./loading";
import { prisma } from "@/lib/prisma";
import { getCachedCategoryIds } from "@/lib/categoryCache";

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
      const ids = await getCachedCategoryIds(category);
      if (ids) where.categoryId = { in: ids };
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
  { tags: ["products"], revalidate: 3600 }
);

interface ProductParams {
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
}

// Async component — fetches data inside Suspense so the shell streams first
async function ProductsContent(params: ProductParams) {
  let data = null;
  try {
    data = await getCachedProducts({
      ...params,
      colors: params.colors.join(","),
      sizes: params.sizes.join(","),
      fabrics: params.fabrics.join(","),
    });
  } catch {}

  return (
    <ProductsPageClient
      initialProducts={data?.products ?? null}
      initialTotal={data?.total ?? null}
      initialTotalPages={data?.totalPages ?? null}
      initialPage={params.page}
    />
  );
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

// Non-async page — MainLayout/nav streams immediately while products load
export default function ProductsPage({ searchParams }: ProductsPageProps) {
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

  return (
    <MainLayout>
      <Suspense fallback={<ProductsLoading />}>
        <ProductsContent
          category={category}
          sort={sort}
          colors={colors}
          sizes={sizes}
          fabrics={fabrics}
          minPrice={minPrice}
          maxPrice={maxPrice}
          page={page}
          search={search}
          featured={featured}
          isNewArrival={isNewArrival}
        />
      </Suspense>
    </MainLayout>
  );
}
