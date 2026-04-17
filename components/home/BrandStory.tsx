"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="py-24 section-padding overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Image with parallax */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <motion.div style={{ y }} className="absolute inset-[-10%]">
            <img
              src="https://res.cloudinary.com/dtwjd2xuy/image/upload/f_auto,q_auto,w_600/v1776427657/ChatGPT_Image_Apr_17_2026_05_26_56_PM_pezxaw.png"
              alt="Indian ethnic wear craftsmanship"
              width={600}
              height={750}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {/* Decorative frame */}
          <div className="absolute top-6 left-6 right-6 bottom-6 border border-rose-gold/20 pointer-events-none" />
        </div>

        {/* Content */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-subtitle mb-6"
          >
            Our Story
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-playfair text-4xl md:text-5xl text-charcoal leading-tight mb-8"
          >
            Craftsmanship<br />
            Born from<br />
            <span className="text-rose-gold italic">Heritage</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-5 font-inter text-sm text-charcoal-light leading-relaxed"
          >
            <p>
              Azalea by Zehra was born from a deep love for India's rich textile heritage.
              Every piece in our collection is a celebration of the skilled artisans who
              have perfected their craft over generations.
            </p>
            <p>
              We work directly with master weavers and embroiderers across Jaipur,
              Lucknow, and Surat, ensuring that each garment carries the soul of
              authentic Indian craftsmanship while embracing contemporary silhouettes.
            </p>
            <p>
              From hand-block printed cotton for summer mornings to luxurious chiffon
              adorned with intricate zari work for festive evenings — our collection
              is curated for the modern Indian woman who honors her roots.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex gap-12"
          >
            {[
              { number: "500+", label: "Styles" },
              { number: "50+", label: "Artisans" },
              { number: "10K+", label: "Happy Customers" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-playfair text-3xl text-rose-gold">{stat.number}</p>
                <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
