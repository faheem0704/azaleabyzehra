export const dynamic = "force-dynamic";

import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProductsPageClient from "@/components/products/ProductsPageClient";

export const metadata = {
  title: "Shop All",
  description: "Browse our full collection of premium Indian ethnic wear.",
};

// Products are fetched client-side via API — no DB at build time needed
export default function ProductsPage() {
  return (
    <MainLayout>
      {/* Suspense required for useSearchParams in ProductsPageClient */}
      <Suspense fallback={<div className="pt-32 pb-24 section-padding"><div className="h-96 bg-ivory-200 animate-pulse" /></div>}>
        <ProductsPageClient />
      </Suspense>
    </MainLayout>
  );
}
