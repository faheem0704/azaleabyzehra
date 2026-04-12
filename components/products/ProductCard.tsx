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

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                  {product.stock === 0 ? "Sold Out" : "Quick Add"}
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
        <div className="mt-4 space-y-1.5 px-1">
          <h3 className="font-inter text-sm text-charcoal leading-snug group-hover:text-rose-gold transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-playfair text-base text-charcoal">{formatPrice(product.price)}</span>
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
                  style={{ backgroundColor: color.toLowerCase().replace(/\s/g, "") }}
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
