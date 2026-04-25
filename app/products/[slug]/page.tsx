export const revalidate = 3600;

import { cache } from "react";
import { unstable_cache } from "next/cache";
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
      variants: true,
      _count: { select: { reviews: true } },
    },
  })
);

// Pre-render all product pages at build time — Vercel serves them from CDN edge,
// ISR regenerates in background so stock/price changes propagate within revalidate window
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://azaleabyzehra.com";
  const desc = product.description.replace(/<[^>]+>/g, "").slice(0, 160) || `Shop ${product.name} at Azalea by Zehra`;
  const keywords = [
    product.name,
    product.fabric,
    product.category?.name,
    product.category?.parent?.name,
    "ethnic wear",
    "Indian ethnic wear",
    "Azalea by Zehra",
  ].filter(Boolean) as string[];
  return {
    title: product.name,
    description: desc,
    keywords,
    alternates: { canonical: `${APP_URL}/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: desc,
      type: "website",
      images: product.images.slice(0, 4).map((url: string, i: number) => ({
        url,
        alt: product.imageAlts?.[i] || product.name,
        width: 800,
        height: 1000,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const getRelated = unstable_cache(
    (categoryId: string, excludeId: string) =>
      prisma.product.findMany({
        where: { categoryId, isDeleted: false, NOT: { id: excludeId } },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, slug: true, price: true, compareAtPrice: true,
          images: true, imageAlts: true, stock: true, featured: true, isNewArrival: true,
          categoryId: true, sizes: true, colors: true, fabric: true,
          description: true, createdAt: true,
          category: { select: { id: true, name: true, slug: true, parentId: true } },
        },
      }),
    ["related-products"],
    { tags: ["products"], revalidate: 3600 }
  );
  const related = await getRelated(product.categoryId, product.id);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://azaleabyzehra.com";
  const desc = product.description.replace(/<[^>]+>/g, "").slice(0, 500) || `Shop ${product.name} at Azalea by Zehra`;

  const reviewsWithRating = product.reviews;
  const aggregateRating = reviewsWithRating.length > 0
    ? {
        "@type": "AggregateRating",
        ratingValue: (reviewsWithRating.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewsWithRating.length).toFixed(1),
        reviewCount: product._count.reviews,
        bestRating: 5,
        worstRating: 1,
      }
    : null;

  const breadcrumbItems: { "@type": string; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
  ];
  const parentCat = product.category?.parent;
  const cat = product.category;
  if (parentCat) {
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: parentCat.name, item: `${APP_URL}/products?category=${parentCat.slug}` });
  }
  if (cat) {
    breadcrumbItems.push({ "@type": "ListItem", position: parentCat ? 3 : 2, name: cat.name, item: `${APP_URL}/products?category=${cat.slug}` });
  }
  breadcrumbItems.push({ "@type": "ListItem", position: breadcrumbItems.length + 1, name: product.name, item: `${APP_URL}/products/${product.slug}` });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: desc,
        image: product.images,
        sku: product.id,
        brand: { "@type": "Brand", name: "Azalea by Zehra" },
        offers: {
          "@type": "Offer",
          url: `${APP_URL}/products/${product.slug}`,
          priceCurrency: "INR",
          price: product.price,
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "Azalea by Zehra" },
        },
        ...(aggregateRating ? { aggregateRating } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ],
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, "<\\/") }}
      />
      <ProductDetailClient product={JSON.parse(JSON.stringify(product))} related={JSON.parse(JSON.stringify(related))} />
    </MainLayout>
  );
}
