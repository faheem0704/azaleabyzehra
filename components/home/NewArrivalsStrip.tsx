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

    // On mobile (< 1024px) skip the horizontal pin — let it scroll naturally
    if (window.innerWidth < 1024) return;

    const ctx = gsap.context(() => {
      const totalWidth = track.scrollWidth - section.offsetWidth;

      if (totalWidth > 0) {
        gsap.to(track, {
          x: -totalWidth,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
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
    <section ref={sectionRef} className="bg-ivory overflow-hidden">
      <div className="section-padding pt-10 pb-3 flex items-end justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-subtitle mb-2"
          >
            Fresh In
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-playfair text-3xl md:text-4xl text-charcoal leading-tight"
          >
            New Arrivals
          </motion.h2>
        </div>
        <Link
          href="/new-arrivals"
          className="hidden md:flex items-center gap-2 font-inter text-sm text-rose-gold hover:text-rose-gold-dark transition-colors duration-200 group mb-1"
        >
          View All
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div ref={trackRef} className="flex gap-5 pl-6 md:pl-12 lg:pl-20 xl:pl-32 pr-12 pb-8 mt-5 overflow-x-auto lg:overflow-x-visible hide-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-56 md:w-64 group"
          >
            <Link href={`/products/${product.slug}`}>
              {/* Image fills card — name + price overlaid at bottom */}
              <div className="relative overflow-hidden bg-ivory-200" style={{ height: "clamp(220px, calc(100vh - 260px), 420px)" }}>
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 224px, 256px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
                )}

                {/* NEW badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-charcoal text-white text-[10px] font-inter tracking-widest uppercase px-3 py-1">
                    New
                  </span>
                </div>

                {/* Name + price overlay — always in view */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pt-8 pb-4">
                  <h3 className="font-inter text-sm text-white line-clamp-1 mb-0.5 group-hover:text-rose-gold-light transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="font-playfair text-base text-white/90">{formatPrice(product.price)}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* End CTA card */}
        <div className="flex-shrink-0 w-56 md:w-64 flex items-center justify-center" style={{ height: "clamp(220px, calc(100vh - 260px), 420px)" }}>
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
