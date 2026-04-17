export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import NewArrivalsClient from "@/components/home/NewArrivalsClient";
import { Metadata } from "next";

export const metadata: Metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const products = await prisma.product.findMany({
    where: { isNewArrival: true, isDeleted: false },
    select: {
      id: true, name: true, slug: true, price: true, compareAtPrice: true,
      images: true, imageAlts: true, stock: true, featured: true,
      isNewArrival: true, isOnSale: true, categoryId: true,
      sizes: true, colors: true, fabric: true, description: true, createdAt: true,
      category: { select: { id: true, name: true, slug: true, parentId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <MainLayout>
      <NewArrivalsClient products={products as any} />
    </MainLayout>
  );
}
