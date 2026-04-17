"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

const fallbackImages = [
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
  "https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=600&q=80",
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&q=80",
  "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80",
  "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&q=80",
];

interface LookbookGridProps {
  products: Product[];
}

export default function LookbookGrid({ products }: LookbookGridProps) {
  const display = products.length > 0 ? products.slice(0, 6) : [];

  return (
    <section className="py-24 section-padding">
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-subtitle mb-4"
        >
          Lookbook
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="section-title"
        >
          As Seen, As Loved
        </motion.h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {(display.length > 0 ? display : fallbackImages).map((item, i) => {
          const product = typeof item === "object" ? item : null;
          const src = product?.images[0] || fallbackImages[i % fallbackImages.length];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative overflow-hidden group ${i === 0 ? "md:row-span-2" : ""}`}
            >
              <Link href={product ? `/products/${product.slug}` : "/products"}>
                <div className={`relative w-full ${i === 0 ? "aspect-[3/4] md:aspect-auto md:h-full" : "aspect-[3/4]"} bg-ivory-200`}>
                  <Image
                    src={src}
                    alt={product?.name || `Lookbook ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-all duration-500" />
                  {product && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400 bg-gradient-to-t from-charcoal/80 to-transparent">
                      <p className="font-inter text-xs text-ivory line-clamp-1">{product.name}</p>
                      <p className="font-playfair text-sm text-rose-gold-light">{formatPrice(product.price)}</p>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Link href="/products" className="btn-outline">
          Shop the Collection
        </Link>
      </div>
    </section>
  );
}
