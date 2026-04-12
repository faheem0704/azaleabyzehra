"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Category } from "@/types";

const categoryImages: Record<string, string> = {
  kurtis: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
  "salwar-sets": "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
  "coord-sets": "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=600&q=80",
  dupattas: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
};

const defaultImages = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
  "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=600&q=80",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&q=80",
];

interface FeaturedCategoriesProps {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const displayCategories = categories.slice(0, 4);

  return (
    <section className="section-padding py-24">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {displayCategories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <Link href={`/products?category=${cat.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-ivory-200">
                <img
                  src={categoryImages[cat.slug] || defaultImages[i % defaultImages.length]}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-playfair text-xl text-ivory mb-1">{cat.name}</h3>
                  {cat._count && (
                    <p className="text-xs font-inter text-ivory/70">
                      {cat._count.products} styles
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="font-inter text-sm text-charcoal group-hover:text-rose-gold transition-colors duration-200">
                  Shop {cat.name}
                </span>
                <span className="text-rose-gold opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">
                  →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
