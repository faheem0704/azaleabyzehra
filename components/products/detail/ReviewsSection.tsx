"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { Review } from "@/types";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Props {
  productId: string;
  initialReviews: Review[];
}

export default function ReviewsSection({ productId, initialReviews }: Props) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingReviewImg, setUploadingReviewImg] = useState(false);
  const reviewImgInputRef = useRef<HTMLInputElement>(null);

  const hasReviewed = session?.user?.id
    ? reviews.some((r) => r.userId === session.user!.id)
    : false;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { toast.error("Please sign in to leave a review"); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment, images: reviewImages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews((prev) => [data, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewImageUpload = async (files: FileList | null) => {
    if (!files || reviewImages.length >= 5 || uploadingReviewImg) return;
    setUploadingReviewImg(true);
    try {
      const toUpload = Array.from(files).slice(0, 5 - reviewImages.length);
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      }
      setReviewImages((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingReviewImg(false);
      if (reviewImgInputRef.current) reviewImgInputRef.current.value = "";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Existing reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-ivory-200 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center font-inter text-xs text-rose-gold font-medium">
                  {review.user?.name?.[0] || "A"}
                </div>
                <div>
                  <p className="font-inter text-sm font-medium text-charcoal">
                    {review.user?.name || "Anonymous"}
                  </p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={11}
                        className={s <= review.rating ? "fill-rose-gold text-rose-gold" : "text-ivory-200"}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="font-inter text-sm text-charcoal-light leading-relaxed">
                  {review.comment}
                </p>
              )}
              {review.images && review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {review.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 overflow-hidden border border-ivory-200">
                      <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-inter text-sm text-mauve">
          No reviews yet. Be the first to review this product!
        </p>
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
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setReviewHover(s)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewRating(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={(reviewHover || reviewRating) >= s ? "fill-rose-gold text-rose-gold" : "text-ivory-200"}
                      />
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
              <div>
                <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-2">
                  Photos <span className="normal-case tracking-normal">(optional, max 5)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {reviewImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 overflow-hidden border border-ivory-200 group">
                      <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                      <button
                        type="button"
                        onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {reviewImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => reviewImgInputRef.current?.click()}
                      disabled={uploadingReviewImg}
                      className="w-20 h-20 border-2 border-dashed border-ivory-200 flex flex-col items-center justify-center text-mauve hover:border-rose-gold hover:text-rose-gold transition-colors disabled:opacity-50"
                    >
                      {uploadingReviewImg ? (
                        <span className="text-[10px] font-inter">Uploading…</span>
                      ) : (
                        <>
                          <span className="text-xl leading-none mb-1">+</span>
                          <span className="text-[10px] font-inter">Add photo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={reviewImgInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleReviewImageUpload(e.target.files)}
                />
              </div>
              <Button type="submit" loading={submittingReview} disabled={uploadingReviewImg} size="sm">
                Submit Review
              </Button>
            </form>
          )}
        </div>
      )}
      {hasReviewed && (
        <p className="font-inter text-sm text-mauve border-t border-ivory-200 pt-6">
          You have already reviewed this product.
        </p>
      )}
    </motion.div>
  );
}
