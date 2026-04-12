export const dynamic = "force-dynamic";

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
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isNewArrival: true, isDeleted: false },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.product.findMany({
      where: { featured: true, isDeleted: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { category: true },
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
      <BrandStory />
      <Testimonials />
      <LookbookGrid products={featuredProducts} />
      <Newsletter />
    </MainLayout>
  );
}
