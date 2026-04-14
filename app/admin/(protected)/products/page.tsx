export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage() {
  const [products, categories, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    // BUG-25: fetch real lowStockThreshold from settings
    prisma.settings.findFirst(),
  ]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  return <AdminProductsClient products={products as any} categories={categories} lowStockThreshold={lowStockThreshold} />;
}
