"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems, appliedPromo, setPromo, setItems } =
    useCartStore();

  // stock map: "productId:size:color" → variant stock (caps quantity buttons)
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2999);

  useEffect(() => {
    fetch("/api/config/shipping")
      .then((r) => r.json())
      .then((d) => { if (d.freeShippingThreshold) setFreeShippingThreshold(d.freeShippingThreshold); })
      .catch(() => {});
  }, []);

  // Every time the cart opens, fetch fresh prices AND variant-level stock.
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    // 1. Refresh prices
    const ids = Array.from(new Set(items.map((i) => i.productId)));
    fetch(`/api/products/batch?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((products: { id: string; price: number }[] | null) => {
        if (!products) return;
        const priceMap = new Map(products.map((p) => [p.id, p.price]));
        const refreshed = items.map((item) => {
          const fresh = priceMap.get(item.productId);
          return fresh !== undefined && fresh !== item.price ? { ...item, price: fresh } : item;
        });
        if (refreshed.some((r, i) => r.price !== items[i].price)) setItems(refreshed);
      })
      .catch(() => {});

    // 2. Fetch variant-level stock so + is capped at the correct size/color quantity
    fetch("/api/products/variant-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variants: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color })),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { productId: string; size: string; color: string; stock: number }[] | null) => {
        if (!data) return;
        setStockMap(new Map(data.map((v) => [`${v.productId}:${v.size}:${v.color}`, v.stock])));
      })
      .catch(() => {});
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = totalPrice();
  const discount = appliedPromo?.discountAmount ?? 0;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          items: items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPromo(data);
      setPromoInput("");
      toast.success(`Promo applied: ${data.message}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setPromo(null); setPromoInput(""); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-ivory shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ivory-200">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-rose-gold" />
                <h2 className="font-playfair text-xl text-charcoal">Your Cart</h2>
                {totalItems() > 0 && (
                  <span className="bg-rose-gold text-white text-xs font-inter w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems()}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-charcoal-light hover:text-rose-gold transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                  <ShoppingBag size={48} className="text-ivory-200" />
                  <p className="font-playfair text-xl text-charcoal-light">Your cart is empty</p>
                  <p className="text-sm font-inter text-mauve text-center">
                    Discover our beautiful collection of kurtis and ethnic wear
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="mt-2 inline-flex items-center justify-center border border-charcoal text-charcoal text-xs font-inter tracking-widest uppercase px-6 py-2.5 hover:bg-charcoal hover:text-ivory transition-all duration-200"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-ivory-200">
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 px-6 py-4"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-24 flex-shrink-0 bg-ivory-200 overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-ivory-200" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-playfair text-sm text-charcoal leading-snug truncate">
                          {item.product?.name || "Product"}
                        </h3>
                        <p className="text-xs font-inter text-mauve mt-1">
                          {item.size} · {item.color}
                        </p>
                        <p className="text-sm font-inter text-rose-gold font-medium mt-1">
                          {formatPrice(item.price)}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          {/* Qty */}
                          <div className="flex items-center border border-ivory-200">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-inter text-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                              }
                              disabled={item.quantity >= (stockMap.get(`${item.productId}:${item.size}:${item.color}`) ?? 10)}
                              className="w-7 h-7 flex items-center justify-center text-charcoal hover:text-rose-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-mauve hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-ivory-200 px-6 py-6 space-y-4">
                {/* Free shipping progress */}
                {subtotal < freeShippingThreshold && (
                  <div className="space-y-1.5">
                    <p className="font-inter text-xs text-charcoal-light">
                      Add <span className="text-charcoal font-medium">{formatPrice(freeShippingThreshold - subtotal)}</span> more for free shipping
                    </p>
                    <div className="h-1 bg-ivory-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-gold rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {subtotal >= freeShippingThreshold && (
                  <p className="font-inter text-xs text-rose-gold font-medium">You qualify for free shipping!</p>
                )}
                {/* Promo code */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-rose-gold/5 border border-rose-gold/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-rose-gold" />
                      <span className="font-inter text-sm font-medium text-charcoal tracking-widest">{appliedPromo.code}</span>
                      <span className="font-inter text-xs text-rose-gold">{appliedPromo.message}</span>
                    </div>
                    <button onClick={removePromo} className="text-mauve hover:text-charcoal transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Promo code"
                      className="flex-1 border border-ivory-200 px-3 py-2 text-sm font-inter text-charcoal placeholder-mauve focus:outline-none focus:border-rose-gold"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2 border border-charcoal text-charcoal text-xs font-inter tracking-widest uppercase hover:bg-charcoal hover:text-ivory transition-all duration-200 disabled:opacity-40"
                    >
                      {promoLoading ? "…" : "Apply"}
                    </button>
                  </div>
                )}

                {/* Total */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm text-charcoal-light">Subtotal</span>
                    <span className="font-inter text-sm text-charcoal">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-rose-gold">
                      <span className="font-inter text-sm">Discount</span>
                      <span className="font-inter text-sm">−{formatPrice(Math.min(discount, subtotal))}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-ivory-200 pt-2">
                    <span className="font-inter text-sm font-medium text-charcoal">Total</span>
                    <span className="font-playfair text-lg text-charcoal">{formatPrice(Math.max(0, subtotal - discount))}</span>
                  </div>
                </div>
                <p className="text-xs font-inter text-mauve">
                  Shipping calculated at checkout
                </p>

                <Link href="/checkout" onClick={closeCart}>
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-sm font-inter text-charcoal-light hover:text-rose-gold transition-colors py-1"
                >
                  Continue Shopping →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
