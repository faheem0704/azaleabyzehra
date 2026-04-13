"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Image from "next/image";
import toast from "react-hot-toast";
import { Check, Tag, X } from "lucide-react";

type Step = 1 | 2 | 3;

interface AddressForm {
  name: string; phone: string; line1: string;
  line2: string; city: string; state: string; pincode: string;
}

interface PromoResult {
  code: string;
  discountPercent: number;
  maxDiscount: number | null;
  discountAmount: number;
  message: string;
}

const STEPS = ["Address", "Payment", "Review"];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<AddressForm>({
    name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
  });

  // Shipping
  const [shippingFee, setShippingFee] = useState(199);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2999);

  // Promo
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);

  useEffect(() => {
    fetch("/api/config/shipping")
      .then((r) => r.json())
      .then((d) => { setShippingFee(d.shippingFee); setFreeShippingThreshold(d.freeShippingThreshold); })
      .catch(() => {});
  }, []);

  // Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (status === "unauthenticated") return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-playfair text-3xl text-charcoal mb-4">Your cart is empty</h2>
          <Button onClick={() => router.push("/products")}>Shop Now</Button>
        </div>
      </div>
    );
  }

  const subtotal = totalPrice();
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const discount = appliedPromo?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

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
      setAppliedPromo(data);
      toast.success(`Promo applied: ${data.message}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setAppliedPromo(null); setPromoInput(""); };

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Payment service unavailable");

      const orderRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const { orderId, keyId } = await orderRes.json();

      const options = {
        key: keyId,
        amount: total * 100,
        currency: "INR",
        name: "Azalea by Zehra",
        description: `${items.length} item(s)`,
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const { verified, paymentId } = await verifyRes.json();
          if (verified) await placeOrder(paymentId, "RAZORPAY");
          else toast.error("Payment verification failed");
        },
        prefill: { name: address.name, contact: address.phone, email: session?.user?.email ?? "" },
        theme: { color: "#C9956C" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (paymentId?: string, gateway?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId, quantity: i.quantity,
            size: i.size, color: i.color, price: i.price,
          })),
          address,
          totalAmount: subtotal + shipping,
          paymentId,
          paymentGateway: gateway,
          promoCode: appliedPromo?.code,
          discountAmount: discount,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);
      clearCart();
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-playfair text-4xl text-charcoal mb-10">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center mb-12">
          {STEPS.map((label, i) => {
            const s = (i + 1) as Step;
            const active = step === s;
            const done = step > s;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-inter text-sm transition-all duration-300 ${done ? "bg-rose-gold text-white" : active ? "border-2 border-rose-gold text-rose-gold" : "border border-ivory-200 text-mauve"}`}>
                    {done ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`font-inter text-sm ${active ? "text-charcoal" : "text-mauve"}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 transition-all duration-300 ${done ? "bg-rose-gold" : "bg-ivory-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Address */}
              {step === 1 && (
                <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <h2 className="font-playfair text-2xl text-charcoal">Delivery Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name *" value={address.name} onChange={(e) => setAddress(p => ({ ...p, name: e.target.value }))} required placeholder="Ayesha Khan" />
                    <Input label="Phone Number *" value={address.phone} onChange={(e) => setAddress(p => ({ ...p, phone: e.target.value }))} required placeholder="+91 900 000 0000" />
                  </div>
                  <Input label="Address Line 1 *" value={address.line1} onChange={(e) => setAddress(p => ({ ...p, line1: e.target.value }))} required placeholder="House No., Street" />
                  <Input label="Address Line 2" value={address.line2} onChange={(e) => setAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Area, Landmark (optional)" />
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="City *" value={address.city} onChange={(e) => setAddress(p => ({ ...p, city: e.target.value }))} required placeholder="Mumbai" />
                    <Input label="State *" value={address.state} onChange={(e) => setAddress(p => ({ ...p, state: e.target.value }))} required placeholder="Maharashtra" />
                    <Input label="Pincode *" value={address.pincode} onChange={(e) => setAddress(p => ({ ...p, pincode: e.target.value }))} required placeholder="400001" />
                  </div>
                  <Button
                    onClick={() => {
                      if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
                        toast.error("Please fill all required fields"); return;
                      }
                      setStep(2);
                    }}
                    className="w-full mt-4"
                  >
                    Continue to Payment
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="font-playfair text-2xl text-charcoal">Payment Method</h2>
                  <div className="space-y-4">
                    <div className="border border-rose-gold bg-rose-gold/5 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-inter text-sm font-medium text-charcoal">Pay Online</h3>
                        <span className="text-xs font-inter text-mauve">Razorpay · Cards, UPI, Wallets</span>
                      </div>
                      <Button onClick={handleRazorpayPayment} loading={loading} className="w-full">
                        Pay {formatPrice(total)} — Secure Checkout
                      </Button>
                    </div>
                    <div className="border border-ivory-200 p-5">
                      <h3 className="font-inter text-sm font-medium text-charcoal mb-2">Cash on Delivery</h3>
                      <p className="font-inter text-xs text-mauve mb-4">Pay when your order arrives. Available across India.</p>
                      <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                        Continue with Cash on Delivery
                      </Button>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors">
                    ← Back to Address
                  </button>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="font-playfair text-2xl text-charcoal">Review Your Order</h2>
                  <div className="border border-ivory-200 p-5 space-y-2">
                    <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3">Delivery Address</h3>
                    <p className="font-inter text-sm text-charcoal">{address.name} · {address.phone}</p>
                    <p className="font-inter text-sm text-charcoal-light">{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}</p>
                  </div>
                  <Button onClick={() => placeOrder()} loading={loading} className="w-full">
                    Place Order (Cash on Delivery)
                  </Button>
                  <button onClick={() => setStep(2)} className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors">
                    ← Back to Payment
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-28 border border-ivory-200 p-6 space-y-6">
              <h3 className="font-playfair text-xl text-charcoal">Order Summary</h3>

              {/* Items */}
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-20 flex-shrink-0 bg-ivory-200 overflow-hidden">
                      {item.product?.images?.[0] && (
                        <Image src={item.product.images[0]} alt={item.product?.name || ""} fill className="object-cover" />
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal text-white text-[10px] font-inter rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-xs text-charcoal line-clamp-2">{item.product?.name}</p>
                      <p className="font-inter text-xs text-mauve mt-0.5">{item.size} · {item.color}</p>
                      <p className="font-inter text-sm text-charcoal mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Promo code */}
              <div className="border-t border-ivory-200 pt-4">
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
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      className="flex-1 border border-ivory-200 px-3 py-2 font-inter text-sm text-charcoal placeholder:text-mauve focus:outline-none focus:border-rose-gold tracking-widest uppercase"
                    />
                    <Button onClick={applyPromo} loading={promoLoading} variant="outline" className="px-4 text-xs">
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-ivory-200 pt-4 space-y-3">
                <div className="flex justify-between font-inter text-sm text-charcoal-light">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-inter text-sm text-rose-gold">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>− {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-inter text-sm text-charcoal-light">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs font-inter text-rose-gold">Free shipping on orders over {formatPrice(freeShippingThreshold)}</p>
                )}
                <div className="flex justify-between font-playfair text-lg text-charcoal border-t border-ivory-200 pt-3">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
