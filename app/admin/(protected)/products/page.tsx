export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

const PAGE_SIZE = 20;

export default async function AdminProductsPage() {
  const [totalCount, initialProducts, categories, settings] = await Promise.all([
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.product.findMany({
      where: { isDeleted: false },
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
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.settings.findFirst({ select: { lowStockThreshold: true } }),
  ]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  return <AdminProductsClient initialProducts={JSON.parse(JSON.stringify(initialProducts))} categories={categories} lowStockThreshold={lowStockThreshold} totalCount={totalCount} />;
}
