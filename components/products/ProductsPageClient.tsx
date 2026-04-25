"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductQuickView from "@/components/products/ProductQuickView";
import { Product } from "@/types";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

const DEFAULT_FILTERS = {
  minPrice: "",
  maxPrice: "",
  colors: [] as string[],
  sizes: [] as string[],
  fabrics: [] as string[],
  sort: "newest",
};

interface ProductsPageClientProps {
  initialProducts?: Product[] | null;
  initialTotal?: number | null;
  initialTotalPages?: number | null;
  initialPage?: number;
}

export default function ProductsPageClient({
  initialProducts,
  initialTotal,
  initialTotalPages,
  initialPage = 1,
}: ProductsPageClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const products = initialProducts ?? [];
  const total = initialTotal ?? 0;
  const totalPages = initialTotalPages ?? 1;
  const page = initialPage;

  const filters = {
    sort: searchParams.get("sort") ?? "newest",
    colors: searchParams.get("colors")?.split(",").filter(Boolean) ?? [],
    sizes: searchParams.get("sizes")?.split(",").filter(Boolean) ?? [],
    fabrics: searchParams.get("fabrics")?.split(",").filter(Boolean) ?? [],
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
  };
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount =
    (filters.colors.length > 0 ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.fabrics.length > 0 ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  const pushFilters = useCallback(
    (nextFilters: typeof DEFAULT_FILTERS, nextPage = 1) => {
      const params = new URLSearchParams();
      const category = searchParams.get("category");
      const search = searchParams.get("search");
      const featured = searchParams.get("featured");
      const isNewArrival = searchParams.get("isNewArrival");

      if (category) params.set("category", category);
      if (search) params.set("search", search);
      if (featured) params.set("featured", "true");
      if (isNewArrival) params.set("isNewArrival", "true");
      if (nextFilters.sort && nextFilters.sort !== "newest") params.set("sort", nextFilters.sort);
      if (nextFilters.minPrice) params.set("minPrice", nextFilters.minPrice);
      if (nextFilters.maxPrice) params.set("maxPrice", nextFilters.maxPrice);
      if (nextFilters.colors.length) params.set("colors", nextFilters.colors.join(","));
      if (nextFilters.sizes.length) params.set("sizes", nextFilters.sizes.join(","));
      if (nextFilters.fabrics.length) params.set("fabrics", nextFilters.fabrics.join(","));
      if (nextPage > 1) params.set("page", nextPage.toString());

      const qs = params.toString();
      startTransition(() => {
        router.push(`/products${qs ? `?${qs}` : ""}`);
      });
    },
    [router, searchParams]
  );

  const handleFilterChange = (changed: Partial<typeof DEFAULT_FILTERS>) => {
    const next = { ...filters, ...changed };
    pushFilters(next, 1);
  };

  const handleReset = () => {
    const params = new URLSearchParams();
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const isNewArrival = searchParams.get("isNewArrival");
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (featured) params.set("featured", featured);
    if (isNewArrival) params.set("isNewArrival", isNewArrival);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/products${qs ? `?${qs}` : ""}`);
    });
  };

  const handlePageChange = (p: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    pushFilters(filters, p);
  };

  const categoryName = searchParams.get("category") || "All Products";
  const searchQuery = searchParams.get("search");

  const loading = isPending;

  const productGrid = (extraClass = "") => (
    <div className={`grid grid-cols-2 lg:grid-cols-3 ${extraClass}`}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} priority={i < 4} />
      ))}
    </div>
  );

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-2 mt-16 section-padding lg:px-0">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => handlePageChange(p)}
          className={`w-10 h-10 font-inter text-sm transition-all duration-200 ${
            p === page
              ? "bg-rose-gold text-white"
              : "border border-ivory-200 text-charcoal hover:border-rose-gold hover:text-rose-gold"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <div className="pt-24 lg:pt-32 pb-24">
      {/* Page Header */}
      <div className="section-padding mb-4 lg:mb-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-subtitle mb-3"
        >
          {searchQuery ? "Search Results" : "Collections"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-playfair text-4xl md:text-5xl text-charcoal capitalize"
        >
          {searchQuery ? `"${searchQuery}"` : categoryName.replace(/-/g, " ")}
        </motion.h1>

        {/* Mobile: count + filter trigger in one row */}
        <div className="flex items-center justify-between mt-3 lg:hidden">
          <p className="font-inter text-sm text-mauve">
            {!loading ? `${total} style${total !== 1 ? "s" : ""} found` : ""}
          </p>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 font-inter text-xs tracking-[0.15em] uppercase text-charcoal hover:text-rose-gold transition-colors"
          >
            <SlidersHorizontal size={13} />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        {/* Desktop count */}
        {total > 0 && !loading && (
          <p className="hidden lg:block font-inter text-sm text-mauve mt-2">
            {total} styles found
          </p>
        )}
      </div>

      {/* ── Desktop layout: sidebar + 3-col grid ── */}
      <div className="hidden lg:flex section-padding gap-10">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          mobileOpen={false}
          onMobileOpenChange={() => {}}
        />
        <div className="flex-1 min-w-0">
          {products.length === 0 && !loading ? (
            <div className="text-center py-24">
              <p className="font-playfair text-2xl text-charcoal-light mb-4">No products found</p>
              <p className="font-inter text-sm text-mauve mb-8">
                Try adjusting your filters or browse our full collection
              </p>
              <button onClick={handleReset} className="btn-outline">Clear Filters</button>
            </div>
          ) : (
            <div className={`transition-opacity duration-150 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
              {productGrid("gap-6")}
              {pagination}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile / tablet layout ── */}
      <div className="lg:hidden px-3 md:px-6">
        {products.length === 0 && !loading ? (
          <div className="text-center py-24">
            <p className="font-playfair text-2xl text-charcoal-light mb-4">No products found</p>
            <p className="font-inter text-sm text-mauve mb-8">
              Try adjusting your filters or browse our full collection
            </p>
            <button onClick={handleReset} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <div className={`transition-opacity duration-150 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            {productGrid("gap-3 md:gap-4 md:grid-cols-3")}
            {pagination}
          </div>
        )}
      </div>

      {/* Mobile filter drawer — controlled by lifted state */}
      <div className="lg:hidden">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          mobileOpen={mobileFilterOpen}
          onMobileOpenChange={setMobileFilterOpen}
        />
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
