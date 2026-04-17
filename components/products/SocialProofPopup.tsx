"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";

const KERALA_CITIES = [
  "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kannur",
  "Kollam", "Alappuzha", "Palakkad", "Malappuram", "Kottayam",
  "Ernakulam", "Kasaragod", "Calicut", "Munnar", "Guruvayur",
  "Thalassery", "Perinthalmanna", "Changanacherry", "Pathanamthitta", "Wayanad",
];

const OTHER_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
  "Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow",
  "Coimbatore", "Mangalore", "Mysore", "Goa", "Nagpur",
];

const pickCity = () =>
  Math.random() < 0.8
    ? KERALA_CITIES[Math.floor(Math.random() * KERALA_CITIES.length)]
    : OTHER_CITIES[Math.floor(Math.random() * OTHER_CITIES.length)];

type PopupProduct = { name: string; slug: string; image: string | null };

type PopupInfo = { product: PopupProduct; city: string; minutesAgo: number };

export default function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<PopupInfo | null>(null);
  const productsRef = useRef<PopupProduct[]>([]);

  // Fetch store products once on mount
  useEffect(() => {
    fetch("/api/products?pageSize=50&page=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.data?.length) return;
        productsRef.current = data.data
          .filter((p: { stock: number }) => p.stock > 0)
          .map((p: { name: string; slug: string; images: string[] }) => ({
            name: p.name,
            slug: p.slug,
            image: p.images?.[0] ?? null,
          }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const show = () => {
      const pool = productsRef.current;
      if (pool.length === 0) {
        // Products not loaded yet — retry in 5s
        nextTimer = setTimeout(show, 5000);
        return;
      }

      setCurrent({
        product: pool[Math.floor(Math.random() * pool.length)],
        city: pickCity(),
        minutesAgo: Math.floor(Math.random() * 20) + 1,
      });
      setVisible(true);

      // Show for 15 seconds then hide
      hideTimer = setTimeout(() => setVisible(false), 15000);

      // Next popup 1–2 minutes after this one hides
      nextTimer = setTimeout(show, 15000 + Math.random() * 60000 + 60000);
    };

    // First popup 8–12 seconds after page load
    nextTimer = setTimeout(show, Math.random() * 4000 + 8000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, []);

  if (!current) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, x: -8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 16, x: -8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-6 left-4 z-50 bg-white shadow-xl border border-ivory-200 max-w-[280px]"
        >
          {/* Entire card is a link to the product */}
          <Link
            href={`/products/${current.product.slug}`}
            onClick={() => setVisible(false)}
            className="flex items-center gap-3 pr-8 pl-2 py-2.5"
          >
            {current.product.image ? (
              <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden bg-ivory-200">
                <Image
                  src={current.product.image}
                  alt={current.product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={15} className="text-rose-gold" />
              </div>
            )}

            <div className="min-w-0">
              <p className="font-inter text-[11px] text-charcoal-light">
                Someone from <span className="font-semibold text-charcoal">{current.city}</span>
              </p>
              <p className="font-inter text-[11px] text-charcoal-light mt-0.5">
                purchased{" "}
                <span className="font-medium text-charcoal line-clamp-1">
                  {current.product.name}
                </span>
              </p>
              <p className="font-inter text-[10px] text-mauve mt-0.5">
                {current.minutesAgo} min ago
              </p>
            </div>
          </Link>

          {/* Dismiss button — sits on top of the link */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-1.5 right-1.5 text-mauve hover:text-charcoal transition-colors"
            aria-label="Dismiss"
          >
            <X size={11} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
