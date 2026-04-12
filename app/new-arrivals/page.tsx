export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import NewArrivalsClient from "@/components/home/NewArrivalsClient";
import { Metadata } from "next";

export const metadata: Metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const products = await prisma.product.findMany({
    where: { isNewArrival: true, isDeleted: false },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <MainLayout>
      <NewArrivalsClient products={products as any} />
    </MainLayout>
  );
}
