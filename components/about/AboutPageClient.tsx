"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Leaf, Star, Users } from "lucide-react";

const VALUES = [
  { icon: Heart, title: "Crafted with Love", desc: "Every stitch, every motif, every colour is chosen with intention. We believe clothing should carry emotion." },
  { icon: Leaf, title: "Sustainably Sourced", desc: "We work with artisans who use natural dyes and eco-friendly processes, honouring both craft and environment." },
  { icon: Star, title: "Uncompromising Quality", desc: "Each piece goes through rigorous quality checks before it reaches you. We accept only the finest fabrics and workmanship." },
  { icon: Users, title: "Artisan-First", desc: "Fair wages, safe working conditions, and long-term relationships with our weavers are non-negotiable for us." },
];

const TEAM = [
  { name: "Zehra", role: "Founder & Creative Director", quote: "I started Azalea because I wanted women to feel like royalty in their everyday ethnic wear — not just at weddings." },
];

export default function AboutPageClient() {
  return (
    <div className="pt-32 pb-24">

      {/* Hero */}
      <section className="section-padding text-center mb-24">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="section-subtitle mb-4">Our Story</motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-playfair text-5xl md:text-6xl text-charcoal leading-tight mb-6"
        >
          Draped in <span className="text-rose-gold italic">Elegance.</span><br />Crafted with Love.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-inter text-sm text-charcoal-light max-w-xl mx-auto leading-relaxed"
        >
          Azalea by Zehra is India&apos;s premium destination for women&apos;s ethnic wear — where centuries-old craft meets the contemporary woman.
        </motion.p>
      </section>

      {/* Brand Story */}
      <section className="section-padding mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative aspect-[4/5] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"
              alt="Artisan craftsmanship"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-6 left-6 right-6 bottom-6 border border-rose-gold/20 pointer-events-none" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <p className="section-subtitle mb-6">How It Began</p>
            <h2 className="font-playfair text-4xl text-charcoal mb-8 leading-tight">
              Born from a deep love for<br /><span className="text-rose-gold italic">India&apos;s textile heritage</span>
            </h2>
            <div className="space-y-5 font-inter text-sm text-charcoal-light leading-relaxed">
              <p>
                Azalea by Zehra was founded with one simple belief: every Indian woman deserves to wear her heritage with pride and comfort, every single day — not just on special occasions.
              </p>
              <p>
                We source directly from master weavers and embroiderers across Jaipur, Lucknow, and Surat, ensuring each garment carries the soul of authentic Indian craftsmanship while embracing modern silhouettes.
              </p>
              <p>
                From hand-block printed cotton for summer mornings to luxurious chiffon adorned with intricate zari work for festive evenings — every piece in our collection is a love letter to Indian craft.
              </p>
            </div>

            <div className="mt-10 flex gap-12">
              {[{ number: "500+", label: "Styles" }, { number: "50+", label: "Artisans" }, { number: "10K+", label: "Happy Customers" }].map((s) => (
                <div key={s.label}>
                  <p className="font-playfair text-3xl text-rose-gold">{s.number}</p>
                  <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-charcoal-dark py-24 section-padding mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-4">What We Stand For</p>
            <h2 className="font-playfair text-4xl text-ivory">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <div className="flex-shrink-0 w-10 h-10 border border-rose-gold/40 flex items-center justify-center">
                  <v.icon size={18} className="text-rose-gold" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl text-ivory mb-2">{v.title}</h3>
                  <p className="font-inter text-sm text-ivory/60 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="section-padding mb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-subtitle mb-4">The Founder</p>
          <h2 className="font-playfair text-4xl text-charcoal mb-12">Meet Zehra</h2>
          {TEAM.map((t) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-ivory-200/50 border border-ivory-200 p-10"
            >
              <blockquote className="font-playfair text-xl text-charcoal italic leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <p className="font-inter text-sm font-medium text-charcoal">{t.name}</p>
              <p className="font-inter text-xs text-mauve mt-1">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-playfair text-4xl text-charcoal mb-4">Ready to explore the collection?</h2>
          <p className="font-inter text-sm text-charcoal-light mb-10">Discover pieces that celebrate who you are.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-primary">Shop Now</Link>
            <Link href="/new-arrivals" className="btn-outline">New Arrivals</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
