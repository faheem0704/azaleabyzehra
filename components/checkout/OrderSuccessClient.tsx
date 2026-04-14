"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setOrder(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="pt-40 text-center font-inter text-sm text-mauve">Loading…</div>;

  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}>
          <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-playfair text-4xl text-charcoal mb-3">Order Confirmed!</h1>
          <p className="font-inter text-sm text-charcoal-light mb-2">
            Thank you for shopping with Azalea by Zehra.
          </p>
          {orderId && (
            <p className="font-inter text-xs text-mauve mb-10">
              Order ID: <span className="font-medium text-charcoal">#{orderId.slice(-8).toUpperCase()}</span>
            </p>
          )}

          {order && (
            <div className="bg-ivory-200/50 border border-ivory-200 p-6 text-left mb-8">
              <h2 className="font-playfair text-xl text-charcoal mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-inter text-sm text-charcoal">{item.product?.name}</p>
                      <p className="font-inter text-xs text-mauve">{item.size} · {item.color} × {item.quantity}</p>
                    </div>
                    <p className="font-inter text-sm text-charcoal flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-ivory-200 pt-3 flex justify-between">
                <p className="font-inter text-sm font-medium text-charcoal">Total</p>
                <p className="font-playfair text-lg text-charcoal">{formatPrice(order.totalAmount)}</p>
              </div>
              {order.address && (
                <div className="border-t border-ivory-200 pt-3 mt-3">
                  <p className="font-inter text-xs text-mauve mb-1">Delivering to</p>
                  <p className="font-inter text-sm text-charcoal">
                    {order.address.name} · {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-ivory-200/30 border border-ivory-200 p-5 mb-10 text-left">
            <div className="flex items-start gap-3">
              <Package size={18} className="text-rose-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-inter text-sm font-medium text-charcoal mb-1">What happens next?</p>
                <p className="font-inter text-xs text-charcoal-light leading-relaxed">
                  You&apos;ll receive an order confirmation via email/SMS. We&apos;ll notify you when your order is shipped with a tracking ID. Standard delivery takes 3–5 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders" className="btn-primary flex items-center justify-center gap-2">
              Track My Order <ArrowRight size={14} />
            </Link>
            <Link href="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
