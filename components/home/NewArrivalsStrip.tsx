"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface NewArrivalsStripProps {
  products: Product[];
}

export default function NewArrivalsStrip({ products }: NewArrivalsStripProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || products.length === 0) return;

    const ctx = gsap.context(() => {
      const totalWidth = track.scrollWidth - section.offsetWidth;

      if (totalWidth > 0) {
        gsap.to(track, {
          x: -totalWidth,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 15%",
            end: () => `+=${totalWidth + 200}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, [products]);

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="overflow-hidden bg-ivory">
      <div className="section-padding pt-14 pb-4 flex items-end justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-subtitle mb-3"
          >
            Fresh In
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-title"
          >
            New Arrivals
          </motion.h2>
        </div>
        <Link
          href="/new-arrivals"
          className="hidden md:flex items-center gap-2 font-inter text-sm text-rose-gold hover:text-rose-gold-dark transition-colors duration-200 group mb-2"
        >
          View All
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div ref={trackRef} className="flex gap-6 pl-6 md:pl-12 lg:pl-20 xl:pl-32 pr-12 pb-16 mt-8">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-64 md:w-72 group"
          >
            <Link href={`/products/${product.slug}`}>
              <div className="relative aspect-[3/4] overflow-hidden bg-ivory-200 mb-4">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-charcoal text-white text-[10px] font-inter tracking-widest uppercase px-3 py-1">
                    New
                  </span>
                </div>
              </div>
              <h3 className="font-inter text-sm text-charcoal group-hover:text-rose-gold transition-colors duration-200 line-clamp-2 mb-1">
                {product.name}
              </h3>
              <p className="font-playfair text-base text-charcoal">{formatPrice(product.price)}</p>
            </Link>
          </motion.div>
        ))}

        {/* End CTA card */}
        <div className="flex-shrink-0 w-64 md:w-72 flex items-center justify-center">
          <Link
            href="/new-arrivals"
            className="flex flex-col items-center gap-4 p-8 border border-ivory-200 hover:border-rose-gold transition-colors duration-300 group"
          >
            <div className="w-12 h-12 border border-rose-gold flex items-center justify-center text-rose-gold group-hover:bg-rose-gold group-hover:text-white transition-all duration-300">
              <ArrowRight size={20} />
            </div>
            <span className="font-inter text-sm tracking-widest uppercase text-charcoal group-hover:text-rose-gold transition-colors">
              View All New Arrivals
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
