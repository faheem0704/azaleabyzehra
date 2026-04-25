import MainLayout from "@/components/layout/MainLayout";
import SearchPageClient from "@/components/search/SearchPageClient";
import { prisma } from "@/lib/prisma";
import { Product } from "@/types";
import type { Metadata } from "next";

const productSelect = {
  id: true, name: true, slug: true, price: true,
  compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
  description: true, colorFamilies: true, isOnSale: true,
  sizes: true, colors: true, fabric: true, stock: true,
  featured: true, isNewArrival: true, createdAt: true,
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  _count: { select: { reviews: true } },
} as const;

interface SearchPageProps {
  searchParams: { q?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = searchParams.q?.trim() ?? "";
  return {
    title: q ? `Search results for "${q}"` : "Search",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim() ?? "";

  let initialProducts: Product[] = [];
  let initialTotal = 0;

  if (q) {
    const where = {
      isDeleted: false,
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { variants: { some: { sku: { contains: q, mode: "insensitive" as const } } } },
      ],
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);

    initialTotal = total;
    initialProducts = products as unknown as Product[];
  }

  return (
    <MainLayout>
      <SearchPageClient
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        query={q}
      />
    </MainLayout>
  );
}
