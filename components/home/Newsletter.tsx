"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("You're on the list!");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 section-padding">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-2xl mx-auto text-center"
      >
        <p className="section-subtitle mb-4">Stay in the loop</p>
        <h2 className="section-title mb-6">
          Join the <span className="text-rose-gold italic">Azalea by Zehra</span> Family
        </h2>
        <p className="font-inter text-sm text-charcoal-light max-w-md mx-auto mb-10 leading-relaxed">
          Be the first to know about new arrivals, exclusive offers, and styling inspiration.
          No spam — only elegance.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 border border-ivory-200 bg-white px-5 py-3.5 font-inter text-sm text-charcoal placeholder-mauve focus:outline-none focus:border-rose-gold transition-colors duration-200"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-rose-gold text-white px-7 py-3.5 font-inter text-sm tracking-widest uppercase hover:bg-rose-gold-dark transition-all duration-300 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Subscribe
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-4 text-xs font-inter text-mauve">
          By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </motion.div>
    </section>
  );
}
