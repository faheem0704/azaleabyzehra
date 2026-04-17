export const revalidate = 300; // ISR: refresh every 5 min — product/category data is stable

import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import NewArrivalsStrip from "@/components/home/NewArrivalsStrip";
import BrandStory from "@/components/home/BrandStory";
import Testimonials from "@/components/home/Testimonials";
import LookbookGrid from "@/components/home/LookbookGrid";
import Newsletter from "@/components/home/Newsletter";

async function getHomeData() {
  const [categories, newArrivals, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { products: true } },
        products: {
          where: { isDeleted: false },
          select: { images: true },
          take: 6,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isNewArrival: true, isDeleted: false },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        images: true, imageAlts: true, stock: true, featured: true, isNewArrival: true, isOnSale: true,
        categoryId: true, sizes: true, colors: true, fabric: true,
        description: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true, parentId: true } },
      },
    }),
    prisma.product.findMany({
      where: { featured: true, isDeleted: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        images: true, imageAlts: true, stock: true, featured: true, isNewArrival: true, isOnSale: true,
        categoryId: true, sizes: true, colors: true, fabric: true,
        description: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true, parentId: true } },
      },
    }),
  ]);

  return { categories, newArrivals, featuredProducts };
}

export default async function HomePage() {
  const { categories, newArrivals, featuredProducts } = await getHomeData();

  return (
    <MainLayout>
      <Hero />
      <FeaturedCategories categories={categories} />
      <NewArrivalsStrip products={newArrivals} />
      <LookbookGrid products={featuredProducts} />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </MainLayout>
  );
}
