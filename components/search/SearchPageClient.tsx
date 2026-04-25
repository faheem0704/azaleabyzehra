"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";

interface SearchPageClientProps {
  initialProducts: Product[];
  initialTotal: number;
  query: string;
}

export default function SearchPageClient({
  initialProducts,
  initialTotal,
  query,
}: SearchPageClientProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input in sync if the page re-renders with a new query (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="pt-32 pb-24 section-padding">
      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b-2 border-charcoal pb-3">
          <Search size={20} className="text-mauve shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search kurtis, sets, dupattas…"
            className="flex-1 bg-transparent text-xl font-playfair text-charcoal placeholder-mauve focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="text-xs font-inter tracking-widest uppercase text-mauve hover:text-charcoal transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results heading */}
      {query && (
        <div className="mb-8">
          <h1 className="font-playfair text-2xl text-charcoal">
            {initialTotal > 0 ? (
              <>
                <span className="text-rose-gold">{initialTotal}</span>{" "}
                {initialTotal === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
              </>
            ) : (
              <>No results found for &ldquo;{query}&rdquo;</>
            )}
          </h1>
          {initialTotal === 0 && (
            <p className="mt-2 font-inter text-sm text-mauve">
              Try a different search term or browse our{" "}
              <a href="/products" className="text-rose-gold hover:underline">
                full collection
              </a>
              .
            </p>
          )}
        </div>
      )}

      {/* No query state */}
      {!query && (
        <p className="font-inter text-sm text-mauve text-center mt-4">
          Enter a search term above to find products.
        </p>
      )}

      {/* Product grid */}
      {initialProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12">
          {initialProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 6} />
          ))}
        </div>
      )}
    </div>
  );
}
