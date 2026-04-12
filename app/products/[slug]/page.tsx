export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import ProductDetailClient from "@/components/products/ProductDetailClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }], isDeleted: false },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }], isDeleted: false },
    include: {
      category: { include: { parent: true } },
      reviews: {
        include: { user: { select: { name: true, id: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isDeleted: false, NOT: { id: product.id } },
    take: 4,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MainLayout>
      <ProductDetailClient product={product as any} related={related as any} />
    </MainLayout>
  );
}
