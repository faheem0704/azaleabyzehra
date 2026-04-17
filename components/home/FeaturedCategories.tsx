"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Category } from "@/types";

// Slug-specific overrides — add entries here as new categories are created
const SLUG_IMAGES: Record<string, string> = {
  kurtis:          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80",
  "salwar-sets":   "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=80",
  "coord-sets":    "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=900&q=80",
  dupattas:        "https://images.unsplash.com/photo-1594938298603-c8148c4b4c7e?w=900&q=80",
  anarkalis:       "https://images.unsplash.com/photo-1537832816519-689ad163238b?w=900&q=80",
  kaftans:         "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  "cotton-sets":   "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&q=80",
  "ethnic-wear":   "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=80",
};

// Fallback pool — cycles for any slug not in the map above
const FALLBACK_POOL = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=80",
  "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=900&q=80",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&q=80",
  "https://images.unsplash.com/photo-1537832816519-689ad163238b?w=900&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4b4c7e?w=900&q=80",
];

const getImage = (slug: string, index: number) =>
  SLUG_IMAGES[slug] ?? FALLBACK_POOL[index % FALLBACK_POOL.length];

interface Props {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-24 section-padding">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-subtitle mb-4"
        >
          Explore
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="section-title"
        >
          Our Collections
        </motion.h2>
      </div>

      {/* ── Desktop: expanding accordion panels ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="hidden md:flex h-[620px] gap-[3px] overflow-hidden"
        onMouseLeave={() => setHoveredId(null)}
      >
        {categories.map((cat, i) => {
          const isHovered  = hoveredId === cat.id;
          const isAny      = hoveredId !== null;
          const isCollapsed = isAny && !isHovered;

          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="relative overflow-hidden flex-shrink-0 block"
              style={{
                flex: isHovered ? 4 : isCollapsed ? 0.35 : 1,
                transition: "flex 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={() => setHoveredId(cat.id)}
            >
              {/* Background image */}
              <img
                src={getImage(cat.slug, i)}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: isHovered ? "scale(1.08)" : "scale(1.01)",
                  transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: isHovered
                    ? "linear-gradient(to top, rgba(20,12,8,0.88) 0%, rgba(20,12,8,0.25) 55%, transparent 100%)"
                    : "linear-gradient(to top, rgba(20,12,8,0.80) 0%, rgba(20,12,8,0.45) 65%, rgba(20,12,8,0.10) 100%)",
                  transition: "background 0.65s ease",
                }}
              />

              {/* Collapsed: vertical label */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  opacity: isCollapsed ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              >
                <span
                  className="font-playfair text-ivory/90 text-xs tracking-[0.22em] uppercase whitespace-nowrap select-none"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {cat.name}
                </span>
              </div>

              {/* Expanded: bottom content */}
              <div
                className="absolute bottom-0 left-0 right-0 p-7 pointer-events-none"
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  transform: isHovered ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.4s ease, transform 0.45s ease",
                }}
              >
                {cat._count !== undefined && (
                  <p className="font-inter text-[11px] tracking-[0.25em] uppercase text-ivory/55 mb-2 select-none">
                    {cat._count.products} {cat._count.products === 1 ? "style" : "styles"}
                  </p>
                )}
                <h3 className="font-playfair text-white leading-tight select-none"
                  style={{ fontSize: isHovered ? "2rem" : "1.4rem", transition: "font-size 0.4s ease" }}
                >
                  {cat.name}
                </h3>

                {/* CTA — fades + slides in only on hover */}
                <div
                  className="flex items-center gap-2 mt-4"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateX(0)" : "translateX(-10px)",
                    transition: "opacity 0.35s ease 0.18s, transform 0.35s ease 0.18s",
                  }}
                >
                  <span className="font-inter text-xs tracking-[0.2em] uppercase text-rose-gold">
                    Shop Now
                  </span>
                  <ArrowUpRight size={14} className="text-rose-gold" />
                </div>
              </div>

              {/* Rose-gold underline sweeps in from left on hover */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-gold origin-left"
                style={{
                  transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.08s",
                }}
              />

              {/* Top-left index chip — visible only in default/non-hovered state */}
              <div
                className="absolute top-5 left-5 select-none"
                style={{
                  opacity: isAny ? 0 : 0.5,
                  transition: "opacity 0.3s ease",
                }}
              >
                <span className="font-inter text-[10px] tracking-[0.2em] text-ivory/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Mobile: 2-column card grid ── */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
          >
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden block"
            >
              <img
                src={getImage(cat.slug, i)}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-playfair text-base text-ivory leading-tight">{cat.name}</h3>
                {cat._count !== undefined && (
                  <p className="font-inter text-[11px] text-ivory/55 mt-0.5">
                    {cat._count.products} {cat._count.products === 1 ? "style" : "styles"}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
