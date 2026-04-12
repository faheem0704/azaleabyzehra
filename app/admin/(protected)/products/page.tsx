export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <AdminProductsClient products={products as any} categories={categories} />;
}
