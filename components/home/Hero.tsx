"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(SplitText, ScrollTrigger);

const VIDEOS = [
  {
    webm:   "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445195/video1_xz1m2i.webm",
    mp4:    "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445195/video1_optimized_v1kqkh.mp4",
    // Cloudinary auto-generates a JPEG thumbnail from the first frame (so_0)
    poster: "https://res.cloudinary.com/dtwjd2xuy/video/upload/so_0,w_1280,q_80/v1776445195/video1_optimized_v1kqkh.jpg",
  },
  {
    webm:   "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445195/video2_k2hyco.webm",
    mp4:    "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445196/video2_optimized_ixwl3o.mp4",
    poster: "https://res.cloudinary.com/dtwjd2xuy/video/upload/so_0,w_1280,q_80/v1776445196/video2_optimized_ixwl3o.jpg",
  },
  {
    webm:   "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445195/video3_bltlba.webm",
    mp4:    "https://res.cloudinary.com/dtwjd2xuy/video/upload/v1776445196/video3_optimized_ikpmqy.mp4",
    poster: "https://res.cloudinary.com/dtwjd2xuy/video/upload/so_0,w_1280,q_80/v1776445196/video3_optimized_ikpmqy.jpg",
  },
];

const FADE_MS = 900; // crossfade duration in ms — must match CSS transition-duration below

export default function Hero() {
  const headlineRef  = useRef<HTMLHeadingElement>(null);
  const subtitleRef  = useRef<HTMLParagraphElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);
  const badgeRef     = useRef<HTMLDivElement>(null);

  // Video cycling state
  const videoRefs   = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const activeIdxRef = useRef(0);
  const [activeIdx, setActiveIdx]       = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // ── GSAP text animations (unchanged) ────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });
      tl.from(badgeRef.current, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" });
      if (headlineRef.current) {
        const split = new SplitText(headlineRef.current, { type: "chars,words" });
        tl.from(split.chars, { opacity: 0, y: 60, rotateX: -90, stagger: 0.025, duration: 0.9, ease: "power4.out" }, "-=0.3");
      }
      tl.from(subtitleRef.current, { opacity: 0, y: 24, duration: 0.7, ease: "power2.out" }, "-=0.4");
      tl.from(ctaRef.current,      { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" }, "-=0.4");
    });
    return () => ctx.revert();
  }, []);

  // ── Boot: play first video on mount ─────────────────────────────────────
  useEffect(() => {
    videoRefs.current[0]?.play().catch(() => {});
  }, []);

  // ── goTo: crossfade to any index ────────────────────────────────────────
  const goTo = useCallback((rawNext: number) => {
    if (transitioning) return;
    const prev = activeIdxRef.current;
    const next = ((rawNext % VIDEOS.length) + VIDEOS.length) % VIDEOS.length;
    if (next === prev) return;

    setTransitioning(true);

    // Start next video immediately so it's already playing when fade completes
    const nextVid = videoRefs.current[next];
    if (nextVid) {
      nextVid.currentTime = 0;
      nextVid.play().catch(() => {});
    }

    // React state update triggers the CSS opacity transition
    activeIdxRef.current = next;
    setActiveIdx(next);

    // After the fade finishes, pause & rewind the old video
    setTimeout(() => {
      const prevVid = videoRefs.current[prev];
      if (prevVid) { prevVid.pause(); prevVid.currentTime = 0; }
      setTransitioning(false);
    }, FADE_MS + 50);
  }, [transitioning]);

  // Stable ref so onEnded callbacks never hold stale closures
  const goToRef = useRef(goTo);
  useEffect(() => { goToRef.current = goTo; }, [goTo]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-charcoal-dark">

      {/* ── Video layers ─────────────────────────────────────────────────── */}
      {VIDEOS.map((v, i) => (
        <video
          key={i}
          ref={el => { videoRefs.current[i] = el; }}
          muted
          playsInline
          poster={v.poster}
          preload={i === 0 ? "metadata" : "none"}
          onEnded={() => { if (i === activeIdxRef.current) goToRef.current(i + 1); }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            zIndex: 0,
            opacity: i === activeIdx ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            willChange: "opacity",
          }}
        >
          {/* WebM first — smaller file, supported by Chrome/Firefox/Edge */}
          <source src={v.webm} type="video/webm" />
          {/* MP4 fallback — for Safari */}
          <source src={v.mp4}  type="video/mp4" />
        </video>
      ))}

      {/* ── Fabric texture overlay ───────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #C9956C, #C9956C 1px, transparent 1px, transparent 12px)`,
          zIndex: 1,
        }}
      />

      {/* ── Gradient overlays ────────────────────────────────────────────── */}
      {/* Main cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-dark/60 via-charcoal-dark/40 to-charcoal-dark/80 pointer-events-none" style={{ zIndex: 2 }} />
      {/* Header legibility band — darkens only the top 160px where the nav sits */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" style={{ zIndex: 2 }} />
      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ivory to-transparent pointer-events-none" style={{ zIndex: 3 }} />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative text-center section-padding max-w-5xl mx-auto" style={{ zIndex: 10 }}>
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
          Discover India's finest collection of Kurtis, Salwar Sets, and ethnic wear —
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

      {/* ── Video progress dots ──────────────────────────────────────────── */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3"
        style={{ zIndex: 10 }}
      >
        {VIDEOS.map((_, i) => (
          <button
            key={i}
            aria-label={`Play video ${i + 1}`}
            onClick={() => goToRef.current(i)}
            className="rounded-full transition-all duration-500 focus:outline-none"
            style={{
              width:      i === activeIdx ? 28 : 8,
              height:     8,
              background: i === activeIdx
                ? "rgba(201,149,108,0.95)"   // rose-gold active
                : "rgba(255,255,255,0.30)",  // white inactive
              cursor: transitioning ? "default" : "pointer",
            }}
          />
        ))}
      </div>
    </section>
  );
}
