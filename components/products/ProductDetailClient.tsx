"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Share2, Star, ChevronRight } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import ProductCard from "./ProductCard";
import RecentlyViewed, { trackProductView } from "./RecentlyViewed";
import SizeGuideModal from "./SizeGuideModal";
import ProductGallery from "./detail/ProductGallery";
import ReviewsSection from "./detail/ReviewsSection";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  related: Product[];
}

export default function ProductDetailClient({ product, related }: Props) {
  const { data: session } = useSession();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "fabric" | "care" | "reviews">("description");

  const variants: ProductVariant[] = (product as any).variants ?? [];
  const colorImgs = useMemo(() => (product.colorImages ?? {}) as Record<string, string[]>, []); // eslint-disable-line react-hooks/exhaustive-deps
  const displayImages = useMemo(
    () => (colorImgs[selectedColor]?.length > 0 ? colorImgs[selectedColor] : product.images),
    [selectedColor, colorImgs, product.images],
  );

  const getVariantStock = (size: string, color: string): number | null => {
    if (variants.length === 0) return null;
    const v = variants.find((v) => v.size === size && v.color === color);
    return v?.stock ?? 0;
  };

  const currentVariantStock = getVariantStock(selectedSize, selectedColor);
  const effectiveStock = currentVariantStock !== null ? currentVariantStock : product.stock;

  const isSizeOutOfStock = (size: string): boolean => {
    if (variants.length === 0) return product.stock <= 0;
    const sizeVariants = variants.filter((v) => v.size === size);
    if (sizeVariants.length === 0) return false;
    return sizeVariants.every((v) => v.stock <= 0);
  };

  const isColorOutOfStock = (color: string): boolean => {
    if (variants.length === 0) return product.stock <= 0;
    const v = variants.find((v) => v.size === selectedSize && v.color === color);
    return v ? v.stock <= 0 : false;
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  useEffect(() => { trackProductView(product.id); }, [product.id]);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const cartItems = useCartStore((s) => s.items);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const alreadyInCart =
    cartItems.find((i) => i.productId === product.id && i.size === selectedSize && i.color === selectedColor)
      ?.quantity ?? 0;
  const maxCanAdd = Math.max(0, effectiveStock - alreadyInCart);

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    if (!selectedColor) { toast.error("Please select a color"); return; }
    if (effectiveStock <= 0) { toast.error("This variant is out of stock"); return; }
    if (maxCanAdd <= 0) { toast.error("You already have all available stock in your cart"); return; }
    const qtyToAdd = Math.min(quantity, maxCanAdd);
    addItem({ productId: product.id, product, quantity: qtyToAdd, size: selectedSize, color: selectedColor, price: product.price });
    openCart();
    toast.success(qtyToAdd < quantity ? `Added ${qtyToAdd} to cart (stock limit reached)` : "Added to cart!");
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
          <div>
            <ProductGallery
              displayImages={displayImages}
              selectedImage={selectedImage}
              onImageChange={setSelectedImage}
              productName={product.name}
              isNewArrival={product.isNewArrival}
              compareAtPrice={product.compareAtPrice}
            />
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

                {product.reviews && product.reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
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

                <div className="flex items-baseline gap-3 mb-8">
                  <span className="font-playfair text-3xl text-charcoal">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="font-inter text-lg text-mauve line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Color Selector — mobile only */}
                <div className="lg:hidden">
                  {product.colors.length > 0 && (
                    <div className="mb-6">
                      <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">
                        Color: <span className="text-charcoal normal-case tracking-normal font-medium">{selectedColor}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => {
                          const oos = isColorOutOfStock(color);
                          return (
                            <button
                              key={color}
                              onClick={() => { if (!oos) { setSelectedColor(color); setSelectedImage(0); setQuantity(1); } }}
                              disabled={oos}
                              className={`relative px-4 py-2 text-sm font-inter border transition-all duration-200 ${
                                oos
                                  ? "border-ivory-200 text-ivory-200 cursor-not-allowed"
                                  : selectedColor === color
                                  ? "border-rose-gold text-rose-gold"
                                  : "border-ivory-200 text-charcoal-light hover:border-rose-gold"
                              }`}
                            >
                              {color}
                              {oos && <span className="absolute inset-0 flex items-center justify-center"><span className="absolute w-full h-px bg-ivory-200 rotate-45" /></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

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
                      <button
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-xs font-inter text-rose-gold underline underline-offset-2 hover:text-charcoal transition-colors"
                      >
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => {
                        const oos = isSizeOutOfStock(size);
                        return (
                          <button
                            key={size}
                            onClick={() => { if (!oos) { setSelectedSize(size); setQuantity(1); } }}
                            disabled={oos}
                            className={`relative min-w-[48px] px-4 py-2.5 text-sm font-inter border transition-all duration-200 ${
                              oos
                                ? "border-ivory-200 text-ivory-200 cursor-not-allowed"
                                : selectedSize === size
                                ? "border-charcoal bg-charcoal text-white"
                                : "border-ivory-200 text-charcoal hover:border-charcoal"
                            }`}
                          >
                            {size}
                            {oos && <span className="absolute inset-0 flex items-center justify-center"><span className="absolute w-full h-px bg-ivory-200 rotate-45" /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selector — desktop only */}
                <div className="hidden lg:block">
                  {product.colors.length > 0 && (
                    <div className="mb-6">
                      <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">
                        Color: <span className="text-charcoal normal-case tracking-normal font-medium">{selectedColor}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => {
                          const oos = isColorOutOfStock(color);
                          return (
                            <button
                              key={color}
                              onClick={() => { if (!oos) { setSelectedColor(color); setSelectedImage(0); setQuantity(1); } }}
                              disabled={oos}
                              className={`relative px-4 py-2 text-sm font-inter border transition-all duration-200 ${
                                oos
                                  ? "border-ivory-200 text-ivory-200 cursor-not-allowed"
                                  : selectedColor === color
                                  ? "border-rose-gold text-rose-gold"
                                  : "border-ivory-200 text-charcoal-light hover:border-rose-gold"
                              }`}
                            >
                              {color}
                              {oos && <span className="absolute inset-0 flex items-center justify-center"><span className="absolute w-full h-px bg-ivory-200 rotate-45" /></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="mb-8">
                  <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">Quantity</p>
                  <div className="flex items-center border border-ivory-200 w-fit">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors"
                    >
                      −
                    </button>
                    <span className="w-14 text-center font-inter text-sm text-charcoal">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxCanAdd, q + 1))}
                      disabled={quantity >= maxCanAdd || maxCanAdd <= 0}
                      className="w-11 h-11 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-inter text-mauve">
                    {effectiveStock > 5 ? "In Stock" : effectiveStock > 0 ? `Only ${effectiveStock} left` : "Out of Stock"}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex gap-3 mb-6">
                  <Button onClick={handleAddToCart} disabled={effectiveStock <= 0} className="flex-1" size="lg">
                    <ShoppingBag size={16} className="mr-2" />
                    {effectiveStock <= 0 ? "Sold Out" : "Add to Cart"}
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
          <div
            className="flex gap-4 sm:gap-8 border-b border-ivory-200 overflow-x-auto hide-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
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
              <ReviewsSection productId={product.id} initialReviews={product.reviews ?? []} />
            )}
          </div>
        </div>

        {/* You May Also Like */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="section-subtitle text-xs mb-1">Curated for you</p>
                <h2 className="font-playfair text-3xl text-charcoal">You May Also Like</h2>
              </div>
              <div className="flex items-center gap-3">
                {product.category && (
                  <Link
                    href={`/products?category=${product.category.slug}`}
                    className="hidden sm:block font-inter text-xs tracking-widest uppercase text-charcoal-light hover:text-rose-gold transition-colors"
                  >
                    View All →
                  </Link>
                )}
                <button
                  onClick={() => scrollCarousel("left")}
                  className="w-9 h-9 border border-ivory-200 flex items-center justify-center hover:border-charcoal transition-colors"
                >
                  <ChevronRight size={16} className="text-charcoal rotate-180" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="w-9 h-9 border border-ivory-200 flex items-center justify-center hover:border-charcoal transition-colors"
                >
                  <ChevronRight size={16} className="text-charcoal" />
                </button>
              </div>
            </div>

            <div ref={carouselRef} className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {related.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-44 sm:w-52 md:w-60">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        <RecentlyViewed currentProductId={product.id} />
      </div>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedSize={selectedSize}
      />
    </div>
  );
}
