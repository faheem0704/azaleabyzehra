"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ProductQuickViewProps {
  product: Product;
  onClose: () => void;
}

export default function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Please select size and color");
      return;
    }
    addItem({ productId: product.id, product, quantity, size: selectedSize, color: selectedColor, price: product.price });
    openCart();
    onClose();
    toast.success("Added to cart!");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-ivory w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-ivory text-charcoal hover:text-rose-gold"
          >
            <X size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[3/4] bg-ivory-200">
              {product.images[imageIndex] ? (
                <Image src={product.images[imageIndex]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-ivory-200" />
              )}
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setImageIndex(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-ivory/80 flex items-center justify-center hover:bg-ivory">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setImageIndex(i => Math.min(product.images.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-ivory/80 flex items-center justify-center hover:bg-ivory">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Details */}
            <div className="p-8">
              <p className="section-subtitle text-xs mb-2">{product.category?.name}</p>
              <h2 className="font-playfair text-2xl text-charcoal mb-4">{product.name}</h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-playfair text-xl text-charcoal">{formatPrice(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="text-sm font-inter text-mauve line-through">{formatPrice(product.compareAtPrice)}</span>
                )}
              </div>

              {/* Sizes */}
              {product.sizes.length > 0 && (
                <div className="mb-5">
                  <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-sm font-inter border transition-all duration-200 ${
                          selectedSize === size ? "border-charcoal bg-charcoal text-white" : "border-ivory-200 text-charcoal hover:border-charcoal"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors.length > 0 && (
                <div className="mb-5">
                  <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">
                    Color: <span className="text-charcoal normal-case tracking-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-sm font-inter border transition-all duration-200 ${
                          selectedColor === color ? "border-rose-gold text-rose-gold" : "border-ivory-200 text-charcoal-light hover:border-rose-gold"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">Quantity</p>
                <div className="flex items-center border border-ivory-200 w-fit">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-charcoal hover:text-rose-gold">−</button>
                  <span className="w-12 text-center font-inter text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-charcoal hover:text-rose-gold">+</button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleAddToCart} className="flex-1" disabled={product.stock === 0}>
                  <ShoppingBag size={16} className="mr-2" />
                  {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                </Button>
                <button
                  onClick={() => {
                    if (isWishlisted) { removeFromWishlist(product.id); toast.success("Removed from wishlist"); }
                    else { addToWishlist(product.id, product); toast.success("Added to wishlist!"); }
                  }}
                  className="w-12 h-12 border border-ivory-200 flex items-center justify-center hover:border-rose-gold transition-colors"
                >
                  <Heart size={16} className={isWishlisted ? "fill-rose-gold text-rose-gold" : "text-charcoal"} />
                </button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="block mt-4 text-center text-sm font-inter text-charcoal-light hover:text-rose-gold transition-colors"
              >
                View full details →
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
