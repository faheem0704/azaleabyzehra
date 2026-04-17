"use client";

import { useState, useEffect, useCallback } from "react";
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
  fabric: "",
  sort: "newest",
};

export default function SalePageClient() {
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
    params.set("isOnSale", "true");
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
  }, [filters]);

  useEffect(() => {
    fetchProducts(1, filters);
    setPage(1);
  }, [filters]);

  const handleFilterChange = (changed: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  const handleReset = () => setFilters({ ...DEFAULT_FILTERS });

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
          className="section-subtitle mb-3 text-rose-gold"
        >
          Limited Time
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-playfair text-4xl md:text-5xl text-charcoal"
        >
          Sale
        </motion.h1>

        {/* Mobile: count + filter trigger */}
        <div className="flex items-center justify-between mt-3 lg:hidden">
          <p className="font-inter text-sm text-mauve">
            {!loading ? `${total} style${total !== 1 ? "s" : ""} on sale` : ""}
          </p>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 font-inter text-xs tracking-[0.15em] uppercase text-charcoal hover:text-rose-gold transition-colors"
          >
            <SlidersHorizontal size={13} />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        {total > 0 && !loading && (
          <p className="hidden lg:block font-inter text-sm text-mauve mt-2">
            {total} styles on sale
          </p>
        )}
      </div>

      {/* Desktop layout */}
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
              <p className="font-playfair text-2xl text-charcoal-light mb-4">No sale products yet</p>
              <p className="font-inter text-sm text-mauve mb-8">Check back soon for our latest offers</p>
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

      {/* Mobile layout */}
      <div className="lg:hidden px-3 md:px-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{skeletons}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-playfair text-2xl text-charcoal-light mb-4">No sale products yet</p>
            <p className="font-inter text-sm text-mauve mb-8">Check back soon for our latest offers</p>
            <button onClick={handleReset} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <>
            {productGrid("gap-3 md:gap-4 md:grid-cols-3")}
            {pagination}
          </>
        )}
      </div>

      {/* Mobile filter drawer */}
      <div className="lg:hidden">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          mobileOpen={mobileFilterOpen}
          onMobileOpenChange={setMobileFilterOpen}
        />
      </div>

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
