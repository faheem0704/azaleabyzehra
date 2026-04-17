"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    city: "Mumbai",
    rating: 5,
    text: "The quality of fabric is absolutely stunning. I ordered a silk kurti and it arrived beautifully packaged. Will definitely be a repeat customer!",
    image: "P",
  },
  {
    id: 2,
    name: "Kavitha Nair",
    city: "Kochi",
    rating: 5,
    text: "Azalea by Zehra has become my go-to for ethnic wear. The stitching is impeccable and the designs are so unique. Love everything I've ordered.",
    image: "K",
  },
  {
    id: 3,
    name: "Sneha Reddy",
    city: "Bangalore",
    rating: 5,
    text: "Fast delivery, gorgeous packaging, and the kurta was even more beautiful in person. The rose-gold embroidery detail was breathtaking.",
    image: "S",
  },
  {
    id: 4,
    name: "Meera Iyer",
    city: "Chennai",
    rating: 5,
    text: "I wore the festive collection piece to a wedding and received so many compliments. The fit was perfect and the dupatta was divine.",
    image: "M",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-charcoal-dark overflow-hidden">
      <div className="section-padding">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-inter text-xs tracking-[0.2em] uppercase text-rose-gold mb-4"
          >
            Testimonials
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-playfair text-4xl md:text-5xl text-ivory"
          >
            Loved by Our Customers
          </motion.h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden min-h-[240px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 60 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-center px-8"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-8">
                  {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-rose-gold text-rose-gold" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="font-playfair text-xl md:text-2xl text-ivory/90 leading-relaxed italic mb-8">
                  &ldquo;{testimonials[current].text}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-gold flex items-center justify-center font-inter font-semibold text-white">
                    {testimonials[current].image}
                  </div>
                  <div className="text-left">
                    <p className="font-inter text-sm font-medium text-ivory">{testimonials[current].name}</p>
                    <p className="font-inter text-xs text-ivory/50">{testimonials[current].city}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 border border-ivory/20 flex items-center justify-center text-ivory/50 hover:border-rose-gold hover:text-rose-gold transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-px transition-all duration-300 ${
                    i === current ? "w-8 bg-rose-gold" : "w-4 bg-ivory/30"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => navigate(1)}
              className="w-10 h-10 border border-ivory/20 flex items-center justify-center text-ivory/50 hover:border-rose-gold hover:text-rose-gold transition-all duration-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
