"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Share2, Star, ChevronRight } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProductCard from "./ProductCard";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  related: Product[];
}

export default function ProductDetailClient({ product, related }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "fabric" | "care" | "reviews">("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    if (!selectedColor) { toast.error("Please select a color"); return; }
    addItem({ productId: product.id, product, quantity, size: selectedSize, color: selectedColor, price: product.price });
    openCart();
    toast.success("Added to cart!");
  };

  const handleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="pt-28 pb-24">
      {/* Breadcrumb */}
      <div className="section-padding mb-8">
        <nav className="flex items-center gap-2 font-inter text-xs text-mauve">
          <Link href="/" className="hover:text-rose-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-rose-gold transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={12} />
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-rose-gold transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-charcoal truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square overflow-hidden border-2 transition-all duration-200 ${
                      i === selectedImage ? "border-rose-gold" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div
              className="flex-1 relative aspect-[3/4] overflow-hidden bg-ivory-200 cursor-zoom-in"
              onMouseMove={handleZoom}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  priority
                  className={`object-cover transition-transform duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
                  style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <Badge variant="new">New Arrival</Badge>}
                {product.compareAtPrice && (
                  <Badge variant="sale">
                    Sale
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="sticky top-28">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {product.category && (
                  <p className="section-subtitle text-xs mb-3">{product.category.name}</p>
                )}
                <h1 className="font-playfair text-3xl md:text-4xl text-charcoal leading-tight mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                {product.reviews && product.reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= Math.round(avgRating) ? "fill-rose-gold text-rose-gold" : "text-ivory-200"}
                        />
                      ))}
                    </div>
                    <span className="font-inter text-xs text-mauve">
                      {avgRating.toFixed(1)} ({product.reviews.length} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-8">
                  <span className="font-playfair text-3xl text-charcoal">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="font-inter text-lg text-mauve line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Fabric */}
                {product.fabric && (
                  <div className="mb-6 py-4 border-y border-ivory-200">
                    <span className="font-inter text-xs tracking-widest uppercase text-charcoal-light">Fabric: </span>
                    <span className="font-inter text-sm text-charcoal">{product.fabric}</span>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light">
                        Size: <span className="text-charcoal normal-case tracking-normal font-medium">{selectedSize}</span>
                      </p>
                      <button className="text-xs font-inter text-rose-gold underline underline-offset-2">Size Guide</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[48px] px-4 py-2.5 text-sm font-inter border transition-all duration-200 ${
                            selectedSize === size
                              ? "border-charcoal bg-charcoal text-white"
                              : "border-ivory-200 text-charcoal hover:border-charcoal"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {product.colors.length > 0 && (
                  <div className="mb-6">
                    <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">
                      Color: <span className="text-charcoal normal-case tracking-normal font-medium">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 text-sm font-inter border transition-all duration-200 ${
                            selectedColor === color
                              ? "border-rose-gold text-rose-gold"
                              : "border-ivory-200 text-charcoal-light hover:border-rose-gold"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-8">
                  <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">Quantity</p>
                  <div className="flex items-center border border-ivory-200 w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors"
                    >
                      −
                    </button>
                    <span className="w-14 text-center font-inter text-sm text-charcoal">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="w-11 h-11 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-inter text-mauve">
                    {product.stock > 5 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1"
                    size="lg"
                  >
                    <ShoppingBag size={16} className="mr-2" />
                    {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                  </Button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (isWishlisted) { removeFromWishlist(product.id); toast.success("Removed"); }
                      else { addToWishlist(product.id, product); toast.success("Saved to wishlist!"); }
                    }}
                    className="w-14 h-14 border border-ivory-200 flex items-center justify-center hover:border-rose-gold transition-colors group"
                  >
                    <Heart size={18} className={isWishlisted ? "fill-rose-gold text-rose-gold" : "text-charcoal group-hover:text-rose-gold"} />
                  </motion.button>
                </div>

                {/* Share */}
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex items-center gap-2 text-xs font-inter text-charcoal-light hover:text-rose-gold transition-colors"
                >
                  <Share2 size={14} />
                  Share this product
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20 border-t border-ivory-200">
          <div className="flex gap-8 border-b border-ivory-200 overflow-x-auto hide-scrollbar">
            {(["description", "fabric", "care", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-inter text-sm tracking-widest uppercase whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-charcoal text-charcoal"
                    : "border-transparent text-charcoal-light hover:text-charcoal"
                }`}
              >
                {tab === "reviews" && product.reviews
                  ? `Reviews (${product.reviews.length})`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="py-10 max-w-2xl">
            {activeTab === "description" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-inter text-sm text-charcoal-light leading-relaxed">
                {product.description}
              </motion.p>
            )}
            {activeTab === "fabric" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="font-inter text-sm text-charcoal-light"><strong className="text-charcoal">Fabric:</strong> {product.fabric || "Not specified"}</p>
                <p className="font-inter text-sm text-charcoal-light"><strong className="text-charcoal">Available Sizes:</strong> {product.sizes.join(", ")}</p>
                <p className="font-inter text-sm text-charcoal-light"><strong className="text-charcoal">Available Colors:</strong> {product.colors.join(", ")}</p>
              </motion.div>
            )}
            {activeTab === "care" && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 font-inter text-sm text-charcoal-light">
                {["Hand wash or gentle machine wash in cold water", "Do not bleach or tumble dry", "Iron on low heat inside out", "Dry in shade, avoid direct sunlight", "Dry clean recommended for embroidered pieces"].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </motion.ul>
            )}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-ivory-200 pb-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center font-inter text-xs text-rose-gold font-medium">
                            {review.user?.name?.[0] || "A"}
                          </div>
                          <div>
                            <p className="font-inter text-sm font-medium text-charcoal">{review.user?.name || "Anonymous"}</p>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} size={11} className={s <= review.rating ? "fill-rose-gold text-rose-gold" : "text-ivory-200"} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="font-inter text-sm text-charcoal-light leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-sm text-mauve">No reviews yet. Be the first to review this product!</p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-playfair text-3xl text-charcoal mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
