export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

const PAGE_SIZE = 20;

interface Props {
  searchParams: { page?: string };
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const currentPage = Math.max(1, parseInt(searchParams.page || "1"));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [totalCount, products, categories, settings] = await Promise.all([
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        id: true, name: true, slug: true, description: true, price: true,
        compareAtPrice: true, images: true, imageAlts: true, categoryId: true,
        sizes: true, colors: true, fabric: true, stock: true,
        featured: true, isNewArrival: true, createdAt: true,
        category: { select: { id: true, name: true } },
        variants: {
          select: { id: true, size: true, color: true, stock: true, sku: true },
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.settings.findFirst({ select: { lowStockThreshold: true } }),
  ]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  return <AdminProductsClient products={products as any} categories={categories} lowStockThreshold={lowStockThreshold} totalCount={totalCount} currentPage={currentPage} pageSize={PAGE_SIZE} />;
}
