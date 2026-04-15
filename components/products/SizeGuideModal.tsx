"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler } from "lucide-react";

const SIZES = [
  { size: "XS",  chest: 34, waist: 32, hip: 38 },
  { size: "S",   chest: 36, waist: 34, hip: 40 },
  { size: "M",   chest: 38, waist: 36, hip: 42 },
  { size: "L",   chest: 40, waist: 38, hip: 44 },
  { size: "XL",  chest: 42, waist: 40, hip: 48 },
  { size: "XXL", chest: 44, waist: 42, hip: 50 },
  { size: "3XL", chest: 46, waist: 44, hip: 52 },
  { size: "4XL", chest: 48, waist: 46, hip: 54 },
  { size: "5XL", chest: 50, waist: 48, hip: 56 },
  { size: "6XL", chest: 52, waist: 50, hip: 58 },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
}

export default function SizeGuideModal({ isOpen, onClose, selectedSize }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-charcoal/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-[91] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-ivory w-full max-w-md pointer-events-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-ivory-200">
                <div className="flex items-center gap-3">
                  <Ruler size={16} className="text-rose-gold" />
                  <h2 className="font-playfair text-xl text-charcoal">Size Guide</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-charcoal-light hover:text-rose-gold transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <p className="font-inter text-xs text-mauve tracking-wide mb-5">
                  All measurements in inches · Chest, waist &amp; hip measured at fullest point
                </p>

                <table className="w-full text-sm font-inter border-collapse">
                  <thead>
                    <tr className="border-b border-ivory-200">
                      <th className="text-left py-2.5 font-medium text-charcoal-light text-xs tracking-widest uppercase">Size</th>
                      <th className="text-center py-2.5 font-medium text-charcoal-light text-xs tracking-widest uppercase">Chest</th>
                      <th className="text-center py-2.5 font-medium text-charcoal-light text-xs tracking-widest uppercase">Waist</th>
                      <th className="text-center py-2.5 font-medium text-charcoal-light text-xs tracking-widest uppercase">Hip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZES.map((row, i) => {
                      const isSelected = row.size === selectedSize;
                      return (
                        <tr
                          key={row.size}
                          className={`border-b border-ivory-200 transition-colors ${
                            isSelected
                              ? "bg-rose-gold/8"
                              : i % 2 === 0
                              ? "bg-transparent"
                              : "bg-ivory-200/40"
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <span className={`font-medium ${isSelected ? "text-rose-gold" : "text-charcoal"}`}>
                              {row.size}
                            </span>
                            {isSelected && (
                              <span className="ml-2 text-[10px] tracking-widest uppercase text-rose-gold">
                                selected
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-center ${isSelected ? "text-charcoal font-medium" : "text-charcoal-light"}`}>
                            {row.chest}
                          </td>
                          <td className={`py-3 text-center ${isSelected ? "text-charcoal font-medium" : "text-charcoal-light"}`}>
                            {row.waist}
                          </td>
                          <td className={`py-3 text-center ${isSelected ? "text-charcoal font-medium" : "text-charcoal-light"}`}>
                            {row.hip}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="font-inter text-xs text-mauve mt-5 leading-relaxed">
                  If you&apos;re between sizes, we recommend sizing up for a relaxed fit or staying true to size for a tailored look.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
