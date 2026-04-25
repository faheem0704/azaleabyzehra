"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

const BLUR_FALLBACK =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJZAAB//2Q==";

// Maps common Indian fashion color names to CSS hex values for accurate swatches.
// Multi-word names (e.g. "Bottle Green") become broken CSS color names without this.
const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a", white: "#ffffff", ivory: "#fffff0", cream: "#fffdd0",
  red: "#e53e3e", maroon: "#800000", pink: "#ec4899", rose: "#f43f5e",
  fuchsia: "#d946ef", purple: "#9333ea", lavender: "#c4b5fd",
  blue: "#3b82f6", navy: "#1e3a5f", teal: "#0d9488", turquoise: "#06b6d4",
  green: "#22c55e", olive: "#6b7c3e", "bottle green": "#006a4e",
  yellow: "#eab308", mustard: "#ca8a04", orange: "#f97316", peach: "#ffcba4",
  brown: "#92400e", beige: "#d4b483", tan: "#b5956a", camel: "#c19a6b",
  grey: "#9ca3af", gray: "#9ca3af", silver: "#d1d5db", charcoal: "#374151",
  "dusty rose": "#c2847a", "dusty pink": "#d4a0a0", mauve: "#b5858f",
  "royal blue": "#2563eb", "sky blue": "#38bdf8", "mint green": "#a7f3d0",
  "forest green": "#15803d", "burnt orange": "#ea580c", "off white": "#f5f0e8",
  gold: "#d4a017", "rose gold": "#c9956c", copper: "#b87333",
};

function colorToHex(name: string): string {
  const key = name.toLowerCase().trim();
  return COLOR_HEX[key] ?? "#d1d5db"; // neutral grey fallback
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

export default function ProductCard({ product, onQuickView, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.productId === product.id));
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // If there are multiple size/color combinations we can't know which variant
    // has stock without fetching variant data. Open Quick View so the customer
    // can pick explicitly. Only do a silent Quick Add when there is exactly one
    // combination (unambiguous).
    const hasMultipleCombos = product.sizes.length > 1 || product.colors.length > 1;
    if (hasMultipleCombos) {
      if (onQuickView) {
        onQuickView(product);
      }
      return;
    }

    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0];

    if (!defaultSize || !defaultColor) {
      toast.error("Please select size and color");
      return;
    }

    addItem({
      productId: product.id,
      product,
      quantity: 1,
      size: defaultSize,
      color: defaultColor,
      price: product.price,
    });
    openCart();
    toast.success("Added to cart!");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product.id, product);
      toast.success("Added to wishlist!");
    }
  };

  const discount = product.compareAtPrice
    ? getDiscountPercent(product.price, product.compareAtPrice)
    : 0;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => { setIsHovered(false); setImageIndex(0); }}
      className="group relative"
    >
      <Link href={`/products/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-ivory-200">
          {product.images[0] ? (
            <Image
              src={product.images[imageIndex] || product.images[0]}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={BLUR_FALLBACK}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200 flex items-center justify-center">
              <span className="font-playfair text-mauve text-sm">No Image</span>
            </div>
          )}

          {/* Hover image dots */}
          {product.images.length > 1 && isHovered && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImageIndex(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === imageIndex ? "bg-white scale-125" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNewArrival && <Badge variant="new">New</Badge>}
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {product.stock < 5 && product.stock > 0 && (
              <Badge variant="warning">Only {product.stock} left</Badge>
            )}
            {product.stock === 0 && <Badge variant="danger">Sold Out</Badge>}
          </div>

          {/* Hover actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-3 flex gap-2"
              >
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-charcoal text-ivory py-2.5 text-xs font-inter tracking-widest uppercase hover:bg-rose-gold transition-all duration-300 disabled:opacity-50"
                >
                  <ShoppingBag size={14} />
                  {product.stock === 0
                    ? "Sold Out"
                    : product.sizes.length > 1 || product.colors.length > 1
                    ? "Quick View"
                    : "Quick Add"}
                </button>
                {onQuickView && (
                  <button
                    onClick={(e) => { e.preventDefault(); onQuickView(product); }}
                    className="w-10 flex items-center justify-center bg-ivory text-charcoal hover:bg-rose-gold hover:text-ivory transition-all duration-300"
                  >
                    <Eye size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 bg-ivory/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-ivory"
          >
            <motion.div
              animate={isWishlisted ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                size={14}
                className={isWishlisted ? "fill-rose-gold text-rose-gold" : "text-charcoal"}
              />
            </motion.div>
          </button>
        </div>

        {/* Info */}
        <div className="mt-2 lg:mt-4 space-y-1 lg:space-y-1.5 px-1">
          <h3 className="font-inter text-xs lg:text-sm text-charcoal leading-snug group-hover:text-rose-gold transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-playfair text-sm lg:text-base text-charcoal">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs font-inter text-mauve line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          {/* Color swatches */}
          {product.colors.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {product.colors.slice(0, 5).map((color) => (
                <div
                  key={color}
                  title={color}
                  className="w-3.5 h-3.5 rounded-full border border-ivory-200 shadow-sm"
                  style={{ backgroundColor: colorToHex(color) }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-xs font-inter text-mauve">+{product.colors.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
