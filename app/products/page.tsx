export const revalidate = 60;

import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProductsPageClient from "@/components/products/ProductsPageClient";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Shop All",
  description: "Browse our full collection of premium Indian ethnic wear.",
};

async function getInitialProducts() {
  try {
    const [total, products] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true, name: true, slug: true, price: true,
          compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
          sizes: true, colors: true, fabric: true, stock: true,
          featured: true, isNewArrival: true, createdAt: true,
          category: { select: { id: true, name: true, slug: true, parentId: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);
    return { products, total, totalPages: Math.ceil(total / 12) };
  } catch {
    return null;
  }
}

export default async function ProductsPage() {
  const initialData = await getInitialProducts();

  return (
    <MainLayout>
      {/* Suspense required for useSearchParams in ProductsPageClient */}
      <Suspense fallback={<div className="pt-32 pb-24 section-padding"><div className="h-96 bg-ivory-200 animate-pulse" /></div>}>
        <ProductsPageClient initialProducts={(initialData?.products ?? null) as any} initialTotal={initialData?.total ?? null} initialTotalPages={initialData?.totalPages ?? null} />
      </Suspense>
    </MainLayout>
  );
}
