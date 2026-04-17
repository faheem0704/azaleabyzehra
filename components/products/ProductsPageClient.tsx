"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/products/ProductCard";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductQuickView from "@/components/products/ProductQuickView";
import { Product } from "@/types";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

const DEFAULT_FILTERS = {
  minPrice: "",
  maxPrice: "",
  colors: [] as string[],
  sizes: [] as string[],
  fabric: "",
  sort: "newest",
};

export default function ProductsPageClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount =
    (filters.colors.length > 0 ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.fabric ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  const fetchProducts = useCallback(async (currentPage = 1, currentFilters = filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("category")) params.set("category", searchParams.get("category")!);
    if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
    if (searchParams.get("featured")) params.set("featured", "true");
    if (searchParams.get("isNewArrival")) params.set("isNewArrival", "true");
    if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
    if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
    if (currentFilters.colors.length) params.set("colors", currentFilters.colors.join(","));
    if (currentFilters.sizes.length) params.set("sizes", currentFilters.sizes.join(","));
    if (currentFilters.fabric) params.set("fabric", currentFilters.fabric);
    params.set("sort", currentFilters.sort);
    params.set("page", currentPage.toString());
    params.set("pageSize", "12");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.data || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [filters, searchParams]);

  useEffect(() => {
    fetchProducts(1, filters);
    setPage(1);
  }, [searchParams, filters]);

  const handleFilterChange = (changed: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  const handleReset = () => setFilters({ ...DEFAULT_FILTERS });

  const categoryName = searchParams.get("category") || "All Products";
  const searchQuery = searchParams.get("search");

  const skeletons = Array.from({ length: 12 }).map((_, i) => (
    <div key={i} className="animate-pulse">
      <div className="aspect-[3/4] bg-ivory-200" />
      <div className="mt-3 space-y-2 px-1">
        <div className="h-3 bg-ivory-200 w-3/4" />
        <div className="h-3 bg-ivory-200 w-1/2" />
      </div>
    </div>
  ));

  const productGrid = (extraClass = "") => (
    <div className={`grid grid-cols-2 lg:grid-cols-3 ${extraClass}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
      ))}
    </div>
  );

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-2 mt-16 section-padding lg:px-0">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => { setPage(p); fetchProducts(p, filters); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
          {loading ? (
            <div className="grid grid-cols-3 gap-6">{skeletons}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-playfair text-2xl text-charcoal-light mb-4">No products found</p>
              <p className="font-inter text-sm text-mauve mb-8">
                Try adjusting your filters or browse our full collection
              </p>
              <button onClick={handleReset} className="btn-outline">Clear Filters</button>
            </div>
          ) : (
            <>
              {productGrid("gap-6")}
              {pagination}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile / tablet layout: edge-to-edge 2-col grid ── */}
      {/* Bleeds out of section-padding (px-6 mobile / px-12 tablet) to keep images wide */}
      <div className="lg:hidden overflow-x-hidden -mx-6 md:-mx-12 px-2 md:px-2">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{skeletons}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 px-6">
            <p className="font-playfair text-2xl text-charcoal-light mb-4">No products found</p>
            <p className="font-inter text-sm text-mauve mb-8">
              Try adjusting your filters or browse our full collection
            </p>
            <button onClick={handleReset} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <>
            {productGrid("gap-2 md:gap-3 md:grid-cols-3")}
            {pagination}
          </>
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
