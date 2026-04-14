"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

const KEY = "azalea_recently_viewed";
const MAX = 4;

export function trackProductView(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      const filtered = ids.filter((id) => id !== currentProductId).slice(0, MAX);
      if (filtered.length === 0) return;

      fetch(`/api/products/batch?ids=${filtered.join(",")}`)
        .then((r) => r.json())
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch {}
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-16 border-t border-ivory-200 pt-12">
      <h2 className="font-playfair text-3xl text-charcoal mb-10">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
