"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ShoppingBag, X } from "lucide-react";

const CITIES = [
  "Mumbai", "Delhi", "Jaipur", "Bangalore", "Chennai", "Hyderabad",
  "Kolkata", "Pune", "Ahmedabad", "Surat", "Lucknow", "Chandigarh",
  "Bhopal", "Indore", "Kochi", "Vadodara", "Agra", "Nashik",
  "Amritsar", "Jodhpur", "Udaipur", "Coimbatore", "Vizag", "Nagpur",
];

const NAMES = [
  "Priya", "Anjali", "Neha", "Sneha", "Pooja", "Kavita", "Ritika",
  "Ananya", "Deepika", "Meera", "Riya", "Shreya", "Sakshi", "Divya",
  "Komal", "Nandini", "Priyanka", "Shweta", "Simran", "Zara",
  "Fatima", "Ayesha", "Sara", "Noor", "Hina", "Isha", "Tanvi",
];

interface Props {
  productName: string;
  productImage?: string;
}

export default function SocialProofPopup({ productName, productImage }: Props) {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState({ name: "", city: "", minutesAgo: 2 });

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const show = () => {
      setInfo({
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
        minutesAgo: Math.floor(Math.random() * 20) + 1,
      });
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 5000);
      // Schedule next appearance 20–35 seconds after current one hides
      nextTimer = setTimeout(show, 5000 + Math.random() * 15000 + 20000);
    };

    // First popup after 6–10 seconds
    nextTimer = setTimeout(show, Math.random() * 4000 + 6000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, x: -8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 16, x: -8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-6 left-4 z-50 bg-white shadow-xl border border-ivory-200 flex items-center gap-3 pr-4 pl-2 py-2.5 max-w-[280px]"
        >
          {/* Product thumbnail or fallback icon */}
          {productImage ? (
            <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden bg-ivory-200">
              <Image src={productImage} alt={productName} fill className="object-cover" sizes="48px" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={15} className="text-rose-gold" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-inter text-[11px] font-semibold text-charcoal">
              {info.name} <span className="font-normal text-charcoal-light">from</span> {info.city}
            </p>
            <p className="font-inter text-[11px] text-charcoal-light mt-0.5 truncate">
              purchased{" "}
              <span className="text-charcoal font-medium">{productName}</span>
            </p>
            <p className="font-inter text-[10px] text-mauve mt-0.5">{info.minutesAgo} min ago</p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="absolute top-1.5 right-1.5 text-mauve hover:text-charcoal transition-colors"
          >
            <X size={11} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
