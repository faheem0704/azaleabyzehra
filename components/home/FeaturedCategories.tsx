"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Category } from "@/types";

// Unsplash fallbacks — use WebP at 700px (Unsplash supports imgix transforms)
const FALLBACK_POOL = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1537832816519-689ad163238b?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1594938298603-c8148c4b4c7e?w=700&q=75&fm=webp",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=75&fm=webp",
];

// Add Cloudinary auto-format + quality + width transforms to reduce payload.
// Raw upload URLs look like: .../upload/v12345/filename.jpg
// Transformed: .../upload/f_auto,q_auto,w_600/v12345/filename.jpg
function optimizeUrl(url: string): string {
  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/upload/") &&
    !url.includes("/upload/f_auto")   // don't double-apply transforms
  ) {
    return url.replace("/upload/", "/upload/f_auto,q_auto,w_600/");
  }
  return url;
}

// Collect up to 6 real product thumbnail images for a category
function getCategoryImages(cat: Category, fallbackIndex: number): string[] {
  const real = (cat.products ?? [])
    .map((p) => p.images?.[0])
    .filter(Boolean) as string[];
  if (real.length > 0) return real;
  // No products yet — return a single fallback so the panel still looks good
  return [FALLBACK_POOL[fallbackIndex % FALLBACK_POOL.length]];
}

interface Props {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Global tick — increments every 3.5 s to drive image rotation across all panels
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

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
          const isHovered   = hoveredId === cat.id;
          const isAny       = hoveredId !== null;
          const isCollapsed = isAny && !isHovered;

          const images     = getCategoryImages(cat, i);
          // Stagger rotation so panels don't all flip at the same moment
          const currentSrc = optimizeUrl(images[(tick + i) % images.length]);

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
              {/* Crossfading product image */}
              <AnimatePresence mode="sync" initial={false}>
                <motion.img
                  key={currentSrc}
                  src={currentSrc}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: isHovered ? "scale(1.08)" : "scale(1.01)",
                    transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </AnimatePresence>

              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
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
                {/* Image dot indicators — only visible on hover with 2+ images */}
                {images.length > 1 && (
                  <div className="flex gap-1.5 mb-4"
                    style={{
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.3s ease 0.1s",
                    }}
                  >
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className="block rounded-full bg-white/60 transition-all duration-300"
                        style={{
                          width: idx === (tick + i) % images.length ? 16 : 6,
                          height: 6,
                          background: idx === (tick + i) % images.length
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.35)",
                        }}
                      />
                    ))}
                  </div>
                )}

                {cat._count !== undefined && (
                  <p className="font-inter text-[11px] tracking-[0.25em] uppercase text-ivory/55 mb-2 select-none">
                    {cat._count.products} {cat._count.products === 1 ? "style" : "styles"}
                  </p>
                )}
                <h3
                  className="font-playfair text-white leading-tight select-none"
                  style={{
                    fontSize: isHovered ? "2rem" : "1.4rem",
                    transition: "font-size 0.4s ease",
                  }}
                >
                  {cat.name}
                </h3>

                {/* CTA */}
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

              {/* Rose-gold underline sweeps in */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-gold origin-left pointer-events-none"
                style={{
                  transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.08s",
                }}
              />

              {/* Index chip */}
              <div
                className="absolute top-5 left-5 select-none pointer-events-none"
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
        {categories.map((cat, i) => {
          const images     = getCategoryImages(cat, i);
          const currentSrc = optimizeUrl(images[(tick + i) % images.length]);

          return (
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
                <AnimatePresence mode="sync" initial={false}>
                  <motion.img
                    key={currentSrc}
                    src={currentSrc}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
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
          );
        })}
      </div>
    </section>
  );
}
