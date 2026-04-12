"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { useWishlistStore } from "@/store/wishlistStore";
import { Product } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPageClient() {
  const { items } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) { setLoading(false); return; }
      const ids = items.map((i) => i.productId);
      const promises = ids.map((id) => fetch(`/api/products/${id}`).then((r) => r.json()));
      const results = await Promise.allSettled(promises);
      setProducts(results.filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled").map((r) => r.value));
      setLoading(false);
    }
    fetchProducts();
  }, [items.length]);

  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="section-subtitle mb-3">Saved Items</p>
          <h1 className="font-playfair text-4xl text-charcoal">My Wishlist</h1>
        </div>
        {items.length > 0 && (
          <p className="font-inter text-sm text-mauve">{items.length} items</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-ivory-200" />
              <div className="mt-3 space-y-2"><div className="h-3 bg-ivory-200 w-3/4" /><div className="h-3 bg-ivory-200 w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center py-32">
          <Heart size={48} className="mx-auto text-ivory-200 mb-6" />
          <p className="font-playfair text-2xl text-charcoal-light mb-4">Your wishlist is empty</p>
          <p className="font-inter text-sm text-mauve mb-8">Save items you love to revisit them later</p>
          <Link href="/products" className="btn-primary">Discover Products</Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
