"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface Props {
  displayImages: string[];
  selectedImage: number;
  onImageChange: (index: number) => void;
  productName: string;
  isNewArrival: boolean;
  compareAtPrice: number | null | undefined;
}

export default function ProductGallery({
  displayImages,
  selectedImage,
  onImageChange,
  productName,
  isNewArrival,
  compareAtPrice,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const didSwipeRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    didSwipeRef.current = false;
    setIsSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setSwipeDelta(e.targetTouches[0].clientX - touchStartX.current);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    setSwipeDelta(0);
    setIsSwiping(false);
    if (Math.abs(diff) < 40) return;
    didSwipeRef.current = true;
    if (diff > 0) onImageChange(Math.min(displayImages.length - 1, selectedImage + 1));
    else onImageChange(Math.max(0, selectedImage - 1));
  };

  return (
    <>
      {/* ── Desktop: thumbnails left + main image with arrows + zoom ── */}
      <div className="hidden lg:flex gap-4">
        {displayImages.length > 1 && (
          <div className="flex flex-col gap-3 w-20 flex-shrink-0">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => onImageChange(i)}
                className={`relative aspect-square overflow-hidden border-2 transition-all duration-200 ${
                  i === selectedImage ? "border-rose-gold" : "border-transparent hover:border-ivory-200"
                }`}
              >
                <Image src={img} alt={`${productName} view ${i + 1}`} fill loading="eager" className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}

        <div
          className="flex-1 relative aspect-[3/4] overflow-hidden bg-ivory-200 cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="wait" initial={false}>
            {displayImages[selectedImage] ? (
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={displayImages[selectedImage]}
                  alt={productName}
                  fill
                  priority
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-ivory to-ivory-200" />
            )}
          </AnimatePresence>

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isNewArrival && <Badge variant="new">New Arrival</Badge>}
            {compareAtPrice && <Badge variant="sale">Sale</Badge>}
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); onImageChange(Math.max(0, selectedImage - 1)); }}
                disabled={selectedImage === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 hover:bg-white"
              >
                <ChevronLeft size={18} className="text-charcoal" />
              </button>
              <button
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); onImageChange(Math.min(displayImages.length - 1, selectedImage + 1)); }}
                disabled={selectedImage === displayImages.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 hover:bg-white"
              >
                <ChevronRight size={18} className="text-charcoal" />
              </button>
            </>
          )}

          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-charcoal/60 text-ivory text-xs font-inter px-2 py-0.5 rounded-full">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile / Tablet: full-width swipeable carousel ── */}
      <div className="lg:hidden">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-ivory-200"
          style={{ touchAction: isSwiping ? "none" : "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute inset-0 flex"
            style={{
              width: `${displayImages.length * 100}%`,
              transform: `translateX(calc(${-selectedImage * (100 / displayImages.length)}% + ${swipeDelta}px))`,
              transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              willChange: "transform",
            }}
          >
            {displayImages.map((img, i) => (
              <div
                key={i}
                className="relative flex-shrink-0"
                style={{ width: `${100 / displayImages.length}%` }}
              >
                <Image
                  src={img}
                  alt={`${productName} view ${i + 1}`}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isNewArrival && <Badge variant="new">New Arrival</Badge>}
            {compareAtPrice && <Badge variant="sale">Sale</Badge>}
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={() => { if (didSwipeRef.current) return; onImageChange(Math.max(0, selectedImage - 1)); }}
                className="absolute left-0 top-0 bottom-0 w-1/4"
                aria-label="Previous image"
              />
              <button
                onClick={() => { if (didSwipeRef.current) return; onImageChange(Math.min(displayImages.length - 1, selectedImage + 1)); }}
                className="absolute right-0 top-0 bottom-0 w-1/4"
                aria-label="Next image"
              />
            </>
          )}

          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => onImageChange(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === selectedImage ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute top-4 right-4 bg-charcoal/50 text-ivory text-xs font-inter px-2 py-0.5 rounded-full">
            {selectedImage + 1}/{displayImages.length}
          </div>
        </div>

        {displayImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => onImageChange(i)}
                className={`relative w-16 h-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                  i === selectedImage ? "border-rose-gold" : "border-transparent"
                }`}
              >
                <Image src={img} alt={`View ${i + 1}`} fill loading={i === 0 ? "eager" : "lazy"} className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && displayImages[selectedImage] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {displayImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onImageChange(Math.max(0, selectedImage - 1)); }}
                  disabled={selectedImage === 0}
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/60 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onImageChange(Math.min(displayImages.length - 1, selectedImage + 1)); }}
                  disabled={selectedImage === displayImages.length - 1}
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

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
                src={displayImages[selectedImage]}
                alt={productName}
                fill
                loading="eager"
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </motion.div>

            {displayImages.length > 1 && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-inter text-xs text-white/50">
                {selectedImage + 1} / {displayImages.length}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
