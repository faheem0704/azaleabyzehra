"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const DEFAULT_COLORS = ["Black", "White", "Navy", "Maroon", "Green", "Pink", "Cream", "Blue", "Grey", "Orange"];
const DEFAULT_FABRICS = ["Cotton", "Lawn", "Chiffon", "Silk", "Linen", "Georgette"];

interface Filters {
  minPrice: string;
  maxPrice: string;
  colors: string[];
  sizes: string[];
  fabrics: string[];
  sort: string;
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-ivory-200 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-inter text-xs tracking-widest uppercase text-charcoal">{title}</span>
        <ChevronDown
          size={14}
          className={cn("text-mauve transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, onReset, mobileOpen, onMobileOpenChange }: FilterSidebarProps) {
  const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);
  const [availableColors, setAvailableColors] = useState(DEFAULT_COLORS);
  const [availableFabrics, setAvailableFabrics] = useState(DEFAULT_FABRICS);

  useEffect(() => {
    fetch("/api/products/options")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { sizes: string[]; colors: string[]; fabrics: string[] } | null) => {
        if (!data) return;
        if (data.sizes.length > 0) setAvailableSizes(data.sizes);
        if (data.colors.length > 0) setAvailableColors(data.colors);
        if (data.fabrics.length > 0) setAvailableFabrics(data.fabrics);
      })
      .catch(() => {});
  }, []);

  const toggleSize = (size: string) => {
    const sizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ sizes });
  };

  const toggleColor = (color: string) => {
    const colors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange({ colors });
  };

  const toggleFabric = (fabric: string) => {
    const fabrics = filters.fabrics.includes(fabric)
      ? filters.fabrics.filter((f) => f !== fabric)
      : [...filters.fabrics, fabric];
    onFilterChange({ fabrics });
  };

  const activeCount =
    (filters.colors.length > 0 ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.fabrics.length > 0 ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  const sidebarContent = (
    <div className="space-y-0">
      {/* Sort */}
      <AccordionSection title="Sort By">
        <div className="space-y-2">
          {[
            { value: "newest", label: "Newest First" },
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "popular", label: "Most Popular" },
          ].map((opt) => (
            <label key={opt.value} onClick={() => onFilterChange({ sort: opt.value })} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-4 h-4 border transition-all duration-200",
                  filters.sort === opt.value
                    ? "border-rose-gold bg-rose-gold"
                    : "border-ivory-200 group-hover:border-rose-gold"
                )}
              >
                {filters.sort === opt.value && (
                  <svg viewBox="0 0 16 16" className="w-full h-full text-white" fill="currentColor">
                    <path d="M6.5 11.5L3 8l1-1 2.5 2.5 6-6 1 1z" />
                  </svg>
                )}
              </div>
              <span
                className={cn(
                  "font-inter text-sm",
                  filters.sort === opt.value ? "text-charcoal" : "text-charcoal-light"
                )}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* Price */}
      <AccordionSection title="Price Range">
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onFilterChange({ minPrice: e.target.value })}
            className="w-full border border-ivory-200 px-3 py-2 text-sm font-inter focus:outline-none focus:border-rose-gold"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
            className="w-full border border-ivory-200 px-3 py-2 text-sm font-inter focus:outline-none focus:border-rose-gold"
          />
        </div>
      </AccordionSection>

      {/* Sizes */}
      <AccordionSection title="Size">
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "px-3 py-1.5 text-xs font-inter border transition-all duration-200",
                filters.sizes.includes(size)
                  ? "border-rose-gold bg-rose-gold text-white"
                  : "border-ivory-200 text-charcoal-light hover:border-rose-gold hover:text-rose-gold"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* Colors */}
      <AccordionSection title="Color">
        <div className="space-y-2">
          {availableColors.map((color) => (
            <label key={color} onClick={() => toggleColor(color)} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-4 h-4 border transition-all duration-200",
                  filters.colors.includes(color)
                    ? "border-rose-gold bg-rose-gold"
                    : "border-ivory-200 group-hover:border-rose-gold"
                )}
              >
                {filters.colors.includes(color) && (
                  <svg viewBox="0 0 16 16" className="w-full h-full text-white" fill="currentColor">
                    <path d="M6.5 11.5L3 8l1-1 2.5 2.5 6-6 1 1z" />
                  </svg>
                )}
              </div>
              <span className="font-inter text-sm text-charcoal-light group-hover:text-charcoal">{color}</span>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* Fabric */}
      <AccordionSection title="Fabric">
        <div className="flex flex-wrap gap-2">
          {availableFabrics.map((fabric) => (
            <button
              key={fabric}
              onClick={() => toggleFabric(fabric)}
              className={cn(
                "px-3 py-1.5 text-xs font-inter border transition-all duration-200",
                filters.fabrics.includes(fabric)
                  ? "border-rose-gold bg-rose-gold text-white"
                  : "border-ivory-200 text-charcoal-light hover:border-rose-gold hover:text-rose-gold"
              )}
            >
              {fabric}
            </button>
          ))}
        </div>
      </AccordionSection>

      {activeCount > 0 && (
        <div className="pt-4">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm font-inter text-rose-gold hover:text-rose-gold-dark transition-colors"
          >
            <X size={14} />
            Clear all filters ({activeCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-28">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-playfair text-xl text-charcoal">Filters</h3>
            {activeCount > 0 && (
              <span className="bg-rose-gold text-white text-xs font-inter px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onMobileOpenChange(false)}
              className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-[80] w-80 bg-ivory shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-ivory-200">
                <h3 className="font-playfair text-xl text-charcoal">Filters</h3>
                <button onClick={() => onMobileOpenChange(false)}>
                  <X size={20} className="text-charcoal" />
                </button>
              </div>
              <div className="p-6">
                {sidebarContent}
                <button
                  onClick={() => onMobileOpenChange(false)}
                  className="mt-6 w-full btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
