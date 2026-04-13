export const revalidate = 120;

import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import ProductDetailClient from "@/components/products/ProductDetailClient";

interface Props {
  params: { slug: string };
}

// cache() deduplicates: generateMetadata + page both call this but it only hits DB once
const getProduct = cache(async (slug: string) =>
  prisma.product.findFirst({
    where: { OR: [{ slug }, { id: slug }], isDeleted: false },
    include: {
      category: { include: { parent: true } },
      reviews: {
        include: { user: { select: { name: true, id: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
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
  const product = await getProduct(params.slug);
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
