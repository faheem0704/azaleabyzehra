"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Share2, Star, ChevronRight, ChevronLeft, X, ZoomIn } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProductCard from "./ProductCard";
import RecentlyViewed, { trackProductView } from "./RecentlyViewed";
import SizeGuideModal from "./SizeGuideModal";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const variants: ProductVariant[] = (product as any).variants ?? [];

  // Get stock for a specific size+color combination
  const getVariantStock = (size: string, color: string): number | null => {
    if (variants.length === 0) return null; // no variant data, fall back to product.stock
    const v = variants.find((v) => v.size === size && v.color === color);
    return v?.stock ?? 0;
  };

  // Current variant stock
  const currentVariantStock = getVariantStock(selectedSize, selectedColor);
  const effectiveStock = currentVariantStock !== null ? currentVariantStock : product.stock;

  // Is a given size out of stock across all its colors?
  const isSizeOutOfStock = (size: string): boolean => {
    if (variants.length === 0) return product.stock <= 0; // no variants — fall back to product-level stock
    const sizeVariants = variants.filter((v) => v.size === size);
    if (sizeVariants.length === 0) return false;
    return sizeVariants.every((v) => v.stock <= 0);
  };

  // Is a given color out of stock for the currently selected size?
  const isColorOutOfStock = (color: string): boolean => {
    if (variants.length === 0) return product.stock <= 0; // no variants — fall back to product-level stock
    const v = variants.find((v) => v.size === selectedSize && v.color === color);
    return v ? v.stock <= 0 : false;
  };
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "fabric" | "care" | "reviews">("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Touch swipe for mobile gallery
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return; // ignore taps
    if (diff > 0) setSelectedImage((i) => Math.min(product.images.length - 1, i + 1));
    else setSelectedImage((i) => Math.max(0, i - 1));
  };

  // Horizontal scroll ref for "You May Also Like"
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  useEffect(() => { trackProductView(product.id); }, [product.id]);

  const [reviews, setReviews] = useState<any[]>(product.reviews || []);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const hasReviewed = session?.user?.id ? reviews.some((r: any) => r.userId === session.user!.id) : false;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { toast.error("Please sign in to leave a review"); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews((prev) => [data, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

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
    if (effectiveStock <= 0) { toast.error("This variant is out of stock"); return; }
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
          <div>
            {/* ── Desktop: thumbnails left + main image with arrows + zoom ── */}
            <div className="hidden lg:flex gap-4">
              {/* Thumbnail strip */}
              {product.images.length > 1 && (
                <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative aspect-square overflow-hidden border-2 transition-all duration-200 ${
                        i === selectedImage ? "border-rose-gold" : "border-transparent hover:border-ivory-200"
                      }`}
                    >
                      <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-ivory-200 cursor-zoom-in group"
                onMouseMove={handleZoom}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onClick={() => setLightboxOpen(true)}
              >
                {product.images[selectedImage] ? (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={`object-cover transition-transform duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
                    style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNewArrival && <Badge variant="new">New Arrival</Badge>}
                  {product.compareAtPrice && <Badge variant="sale">Sale</Badge>}
                </div>

                {/* Prev / Next arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous image"
                      onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                      disabled={selectedImage === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 hover:bg-white"
                    >
                      <ChevronLeft size={18} className="text-charcoal" />
                    </button>
                    <button
                      aria-label="Next image"
                      onClick={() => setSelectedImage((i) => Math.min(product.images.length - 1, i + 1))}
                      disabled={selectedImage === product.images.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 hover:bg-white"
                    >
                      <ChevronRight size={18} className="text-charcoal" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-charcoal/60 text-ivory text-xs font-inter px-2 py-0.5 rounded-full">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile / Tablet: full-width swipeable carousel ── */}
            <div className="lg:hidden">
              <div
                className="relative aspect-[3/4] overflow-hidden bg-ivory-200"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {product.images[selectedImage] ? (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNewArrival && <Badge variant="new">New Arrival</Badge>}
                  {product.compareAtPrice && <Badge variant="sale">Sale</Badge>}
                </div>

                {/* Prev / Next tap areas */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                      className="absolute left-0 top-0 bottom-0 w-1/4"
                      aria-label="Previous image"
                    />
                    <button
                      onClick={() => setSelectedImage((i) => Math.min(product.images.length - 1, i + 1))}
                      className="absolute right-0 top-0 bottom-0 w-1/4"
                      aria-label="Next image"
                    />
                  </>
                )}

                {/* Dot indicators */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`View image ${i + 1}`}
                        onClick={() => setSelectedImage(i)}
                        className={`rounded-full transition-all duration-200 ${
                          i === selectedImage ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Counter */}
                <div className="absolute top-4 right-4 bg-charcoal/50 text-ivory text-xs font-inter px-2 py-0.5 rounded-full">
                  {selectedImage + 1}/{product.images.length}
                </div>
              </div>

              {/* Thumbnail strip below on mobile */}
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative w-16 h-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                        i === selectedImage ? "border-rose-gold" : "border-transparent"
                      }`}
                    >
                      <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
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
                            onClick={() => !oos && setSelectedSize(size)}
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
                            {oos && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="absolute w-full h-px bg-ivory-200 rotate-45" />
                              </span>
                            )}
                          </button>
                        );
                      })}
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
                      {product.colors.map((color) => {
                        const oos = isColorOutOfStock(color);
                        return (
                          <button
                            key={color}
                            onClick={() => !oos && setSelectedColor(color)}
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
                            {oos && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="absolute w-full h-px bg-ivory-200 rotate-45" />
                              </span>
                            )}
                          </button>
                        );
                      })}
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
                      onClick={() => setQuantity(q => Math.min(Math.max(effectiveStock, 1), q + 1))}
                      disabled={effectiveStock <= 0}
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
                  <Button
                    onClick={handleAddToCart}
                    disabled={effectiveStock <= 0}
                    className="flex-1"
                    size="lg"
                  >
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
          <div className="flex gap-4 sm:gap-8 border-b border-ivory-200 overflow-x-auto hide-scrollbar"
               style={{ WebkitOverflowScrolling: "touch" }}>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Existing reviews */}
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
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

                {/* Write a review */}
                {!hasReviewed && (
                  <div className="border-t border-ivory-200 pt-8">
                    <h3 className="font-playfair text-xl text-charcoal mb-5">Write a Review</h3>
                    {!session ? (
                      <p className="font-inter text-sm text-charcoal-light">
                        <Link href="/login" className="text-rose-gold hover:underline">Sign in</Link> to leave a review.
                      </p>
                    ) : (
                      <form onSubmit={submitReview} className="space-y-4">
                        <div>
                          <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-2">Your Rating</p>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <button key={s} type="button"
                                onMouseEnter={() => setReviewHover(s)}
                                onMouseLeave={() => setReviewHover(0)}
                                onClick={() => setReviewRating(s)}
                                className="focus:outline-none"
                              >
                                <Star size={24} className={(reviewHover || reviewRating) >= s ? "fill-rose-gold text-rose-gold" : "text-ivory-200"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block font-inter text-xs tracking-widest uppercase text-charcoal-light mb-2">
                            Comment <span className="normal-case tracking-normal">(optional)</span>
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                            placeholder="Share your thoughts about this product…"
                            className="w-full border border-ivory-200 bg-white px-4 py-3 font-inter text-sm text-charcoal placeholder-mauve focus:outline-none focus:border-rose-gold transition-colors resize-none"
                          />
                        </div>
                        <Button type="submit" loading={submittingReview} size="sm">Submit Review</Button>
                      </form>
                    )}
                  </div>
                )}
                {hasReviewed && (
                  <p className="font-inter text-sm text-mauve border-t border-ivory-200 pt-6">You have already reviewed this product.</p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* You May Also Like — horizontal scrollable carousel */}
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
                {/* Scroll arrows */}
                <button
                  onClick={() => scrollCarousel("left")}
                  className="w-9 h-9 border border-ivory-200 flex items-center justify-center hover:border-charcoal transition-colors"
                >
                  <ChevronLeft size={16} className="text-charcoal" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="w-9 h-9 border border-ivory-200 flex items-center justify-center hover:border-charcoal transition-colors"
                >
                  <ChevronRight size={16} className="text-charcoal" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto hide-scrollbar pb-2"
            >
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

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && product.images[selectedImage] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Prev / Next in lightbox */}
            {product.images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.max(0, i - 1)); }}
                  disabled={selectedImage === 0}
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.min(product.images.length - 1, i + 1)); }}
                  disabled={selectedImage === product.images.length - 1}
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-2xl max-h-[90vh] w-full mx-8"
              onClick={(e) => e.stopPropagation()}
              style={{ aspectRatio: "3/4" }}
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </motion.div>

            {/* Counter */}
            {product.images.length > 1 && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-inter text-xs text-white/50">
                {selectedImage + 1} / {product.images.length}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
