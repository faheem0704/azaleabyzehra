"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

const ThreeHero = dynamic(() => import("./ThreeHero"), { ssr: false });

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      // Badge
      tl.from(badgeRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
      });

      // Split headline
      if (headlineRef.current) {
        const split = new SplitText(headlineRef.current, { type: "chars,words" });
        tl.from(
          split.chars,
          {
            opacity: 0,
            y: 60,
            rotateX: -90,
            stagger: 0.025,
            duration: 0.9,
            ease: "power4.out",
          },
          "-=0.3"
        );
      }

      // Subtitle
      tl.from(
        subtitleRef.current,
        {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power2.out",
        },
        "-=0.4"
      );

      // CTA
      tl.from(
        ctaRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-charcoal-dark">
      {/* 3D Background */}
      <ThreeHero />

      {/* Fabric texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #C9956C,
            #C9956C 1px,
            transparent 1px,
            transparent 12px
          )`,
          zIndex: 1,
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-dark/60 via-charcoal-dark/40 to-charcoal-dark/80" style={{ zIndex: 2 }} />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ivory to-transparent" style={{ zIndex: 3 }} />

      {/* Content */}
      <div className="relative z-10 text-center section-padding max-w-5xl mx-auto">
        {/* Badge */}
        <div ref={badgeRef}>
          <span className="inline-block font-inter text-xs tracking-[0.4em] uppercase text-rose-gold-light border border-rose-gold/30 px-6 py-2 mb-8">
            Premium Ethnic Wear
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="font-playfair text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-ivory leading-[0.9] mb-8"
          style={{ perspective: "600px" }}
        >
          Draped in<br />
          <span className="text-rose-gold italic">Elegance</span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-inter text-base md:text-lg text-ivory/70 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Discover Pakistan's finest collection of Kurtis, Salwar Sets, and ethnic wear —
          where tradition meets contemporary grace.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-rose-gold text-white px-10 py-4 font-inter text-sm tracking-widest uppercase hover:bg-rose-gold-dark transition-all duration-300 group"
            >
              Shop Now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/new-arrivals"
              className="inline-flex items-center gap-3 border border-ivory/50 text-ivory px-10 py-4 font-inter text-sm tracking-widest uppercase hover:border-rose-gold hover:text-rose-gold transition-all duration-300"
            >
              New Arrivals
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-inter text-[10px] tracking-[0.3em] uppercase text-ivory/40">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-px h-10 bg-gradient-to-b from-ivory/40 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
