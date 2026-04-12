"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/types";

export default function NewArrivalsClient({ products }: { products: Product[] }) {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="text-center mb-16">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="section-subtitle mb-4">Fresh In</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="section-title">New Arrivals</motion.h1>
        <p className="font-inter text-sm text-mauve mt-4">{products.length} new styles</p>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-playfair text-2xl text-charcoal-light">Coming soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
