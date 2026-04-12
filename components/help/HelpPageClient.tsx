"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const FAQ = [
  { cat: "Shipping", q: "How long does delivery take?", a: "Standard delivery takes 3–5 business days across India. Express delivery (1–2 days) is available in metro cities." },
  { cat: "Shipping", q: "Do you offer free shipping?", a: "Yes! Orders over ₹2,999 qualify for free standard shipping. Otherwise, a flat shipping fee of ₹199 applies." },
  { cat: "Returns", q: "What is your return policy?", a: "We offer hassle-free returns within 7 days of delivery for unworn, unwashed items with tags attached. Sale items are final sale." },
  { cat: "Returns", q: "How do I initiate a return?", a: "Contact us via WhatsApp or email with your order number and reason. We'll arrange pickup and process your refund within 5–7 business days." },
  { cat: "Sizing", q: "How do I find my size?", a: "We follow standard Indian sizing. XS (34\"), S (36\"), M (38\"), L (40\"), XL (42\"), XXL (44\"). Measurements are in chest size. We recommend sizing up for a relaxed fit." },
  { cat: "Sizing", q: "Do you offer custom sizes?", a: "Yes! We offer custom stitching on select pieces. Contact us with your measurements and we'll be happy to accommodate." },
  { cat: "Payments", q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, UPI, net banking, and wallets — all processed securely through Razorpay." },
  { cat: "Payments", q: "Is online payment secure?", a: "Absolutely. All online payments are processed through Razorpay with 256-bit SSL encryption. We never store your card details." },
];

const categories = ["All", "Shipping", "Returns", "Sizing", "Payments"];

export default function HelpPageClient() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const filtered = activeCategory === "All" ? FAQ : FAQ.filter((f) => f.cat === activeCategory);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setContactForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <div className="pt-32 pb-24">
      {/* Hero */}
      <div className="section-padding text-center mb-20">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="section-subtitle mb-4">Support</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="section-title mb-6">How Can We Help?</motion.h1>
        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 font-inter text-sm tracking-widest uppercase hover:bg-green-600 transition-colors">
          <MessageCircle size={16} />
          Chat on WhatsApp
        </a>
      </div>

      <div className="section-padding">
        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-24">
          <h2 className="font-playfair text-3xl text-charcoal mb-8">Frequently Asked Questions</h2>

          {/* Category Filter */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 font-inter text-xs tracking-widest uppercase border transition-all duration-200 ${activeCategory === cat ? "bg-charcoal text-ivory border-charcoal" : "border-ivory-200 text-charcoal-light hover:border-charcoal"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border border-ivory-200">
                <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex items-center justify-between w-full px-6 py-5 text-left gap-4">
                  <span className="font-inter text-sm text-charcoal">{faq.q}</span>
                  <ChevronDown size={16} className={`flex-shrink-0 text-mauve transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="px-6 pb-5 font-inter text-sm text-charcoal-light leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Mail size={32} className="mx-auto text-rose-gold mb-4" />
            <h2 className="font-playfair text-3xl text-charcoal mb-3">Still have questions?</h2>
            <p className="font-inter text-sm text-charcoal-light">Send us a message and we'll respond within 24 hours.</p>
          </div>
          <form onSubmit={handleContact} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={contactForm.name} onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ayesha" />
              <Input label="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))} required placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))}
                required
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full border border-ivory-200 bg-white px-4 py-3 text-charcoal placeholder-mauve focus:outline-none focus:border-rose-gold transition-colors font-inter text-sm resize-none"
              />
            </div>
            <Button type="submit" loading={sending} className="w-full">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
