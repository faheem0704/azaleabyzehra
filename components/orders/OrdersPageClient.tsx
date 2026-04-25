"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, COURIERS, getTrackingUrl } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowLeftRight, X } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

interface Variant { size: string; color: string; stock: number; }

interface ExchangeTarget {
  orderId: string;
  itemId: string;
  productId: string;
  currentSize: string;
  currentColor: string;
  quantity: number;
  productName: string;
}

export default function OrdersPageClient({ orders: initial }: { orders: any[] }) {
  const [orders, setOrders] = useState(initial);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Exchange state
  const [exchangeTarget, setExchangeTarget] = useState<ExchangeTarget | null>(null);
  const [exchangeVariants, setExchangeVariants] = useState<Variant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [exchangeSize, setExchangeSize] = useState("");
  const [exchangeColor, setExchangeColor] = useState("");
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const handleCancel = async (orderId: string) => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  };

  const openExchange = async (orderId: string, item: any) => {
    setVariantsLoading(true);
    setExchangeTarget({
      orderId,
      itemId: item.id,
      productId: item.product.id,
      currentSize: item.size,
      currentColor: item.color,
      quantity: item.quantity,
      productName: item.product.name,
    });
    setExchangeSize(item.size);
    setExchangeColor(item.color);
    try {
      const res = await fetch(`/api/products/${item.product.id}/variants`);
      const data: Variant[] = await res.json();
      // Only show variants with enough stock (or the current variant even if OOS since it's being freed)
      const usable = data.filter(
        (v) => v.stock >= item.quantity || (v.size === item.size && v.color === item.color)
      );
      setExchangeVariants(usable);
    } catch {
      toast.error("Could not load available options");
      setExchangeTarget(null);
    } finally {
      setVariantsLoading(false);
    }
  };

  const closeExchange = () => {
    setExchangeTarget(null);
    setExchangeVariants([]);
    setExchangeSize("");
    setExchangeColor("");
  };

  // Unique sizes from available variants
  const availableSizes = Array.from(new Set(exchangeVariants.map((v) => v.size)));

  // Colors available for the currently selected size (sufficient stock)
  const availableColors = exchangeVariants
    .filter((v) => v.size === exchangeSize && (v.stock >= (exchangeTarget?.quantity ?? 1) || (v.size === exchangeTarget?.currentSize && v.color === exchangeTarget?.currentColor)))
    .map((v) => v.color);

  const handleExchange = async () => {
    if (!exchangeTarget) return;
    if (exchangeSize === exchangeTarget.currentSize && exchangeColor === exchangeTarget.currentColor) {
      toast.error("Please select a different size or color"); return;
    }
    setExchangeLoading(true);
    try {
      const res = await fetch(`/api/orders/${exchangeTarget.orderId}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: exchangeTarget.itemId,
          newSize: exchangeSize,
          newColor: exchangeColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== exchangeTarget.orderId) return o;
          return {
            ...o,
            items: o.items.map((item: any) =>
              item.id === exchangeTarget.itemId
                ? { ...item, size: exchangeSize, color: exchangeColor }
                : item
            ),
          };
        })
      );
      toast.success("Size/color updated successfully");
      closeExchange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Exchange failed");
    } finally {
      setExchangeLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl text-charcoal mb-10">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-24 border border-ivory-200">
            <p className="font-playfair text-2xl text-charcoal-light mb-4">No orders yet</p>
            <p className="font-inter text-sm text-mauve mb-8">Start shopping to see your orders here</p>
            <Link href="/products" className="btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-ivory-200 overflow-hidden">
                {/* Order Header */}
                <div className="bg-ivory-200/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="font-inter text-xs text-mauve uppercase tracking-widest">Order</p>
                      <p className="font-inter text-sm font-medium text-charcoal">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="font-inter text-xs text-mauve uppercase tracking-widest">Date</p>
                      <p className="font-inter text-sm text-charcoal">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-inter text-xs text-mauve uppercase tracking-widest">Total</p>
                      <p className="font-playfair text-sm text-charcoal">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="font-inter text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order.id ? "Cancelling…" : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="px-6 py-4 space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative w-14 flex-shrink-0 bg-ivory-200 overflow-hidden" style={{ height: 72 }}>
                        {item.product.images[0] && (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-sm text-charcoal line-clamp-1">{item.product.name}</p>
                        <p className="font-inter text-xs text-mauve mt-0.5">{item.size} · {item.color} · Qty: {item.quantity}</p>
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => openExchange(order.id, item)}
                            className="mt-1.5 flex items-center gap-1 font-inter text-xs text-rose-gold hover:text-rose-gold-dark transition-colors"
                          >
                            <ArrowLeftRight size={12} />
                            Change Size / Color
                          </button>
                        )}
                      </div>
                      <p className="font-inter text-sm text-charcoal flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Tracking */}
                {order.trackingId && (() => {
                  const trackingUrl = order.courierName ? getTrackingUrl(order.courierName, order.trackingId) : null;
                  return (
                    <div className="border-t border-ivory-200 px-6 py-3 bg-ivory-200/30">
                      <p className="font-inter text-xs text-mauve">
                        {order.courierName ? COURIERS.find((c) => c.value === order.courierName)?.name ?? order.courierName : "Tracking ID"}
                      </p>
                      {trackingUrl ? (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-inter text-sm font-medium text-rose-gold hover:underline"
                        >
                          {order.trackingId} →
                        </a>
                      ) : (
                        <p className="font-inter text-sm font-medium text-charcoal">{order.trackingId}</p>
                      )}
                    </div>
                  );
                })()}

                {/* Address */}
                {order.address && (
                  <div className="border-t border-ivory-200 px-6 py-3">
                    <p className="font-inter text-xs text-mauve">
                      {order.address.name} · {order.address.phone} · {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} — {order.address.pincode}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exchange Modal */}
      {exchangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border border-ivory-200 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-200">
              <h2 className="font-playfair text-xl text-charcoal">Change Size / Color</h2>
              <button onClick={closeExchange} className="text-mauve hover:text-charcoal transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="font-inter text-xs text-mauve tracking-widest uppercase mb-1">Product</p>
                <p className="font-inter text-sm text-charcoal">{exchangeTarget.productName}</p>
              </div>

              <div className="flex items-center gap-4 bg-ivory-200/40 border border-ivory-200 px-4 py-3">
                <div>
                  <p className="font-inter text-xs text-mauve tracking-widest uppercase mb-0.5">Current</p>
                  <p className="font-inter text-sm text-charcoal font-medium">{exchangeTarget.currentSize} · {exchangeTarget.currentColor}</p>
                </div>
                <ArrowLeftRight size={16} className="text-rose-gold mx-2 flex-shrink-0" />
                <div>
                  <p className="font-inter text-xs text-mauve tracking-widest uppercase mb-0.5">New</p>
                  <p className="font-inter text-sm text-charcoal font-medium">
                    {exchangeSize || "—"} · {exchangeColor || "—"}
                  </p>
                </div>
              </div>

              {variantsLoading ? (
                <p className="font-inter text-sm text-mauve text-center py-4">Loading available options…</p>
              ) : (
                <>
                  {/* Size */}
                  <div>
                    <label className="font-inter text-xs tracking-widest uppercase text-charcoal-light block mb-2">Select Size</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setExchangeSize(size);
                            // Reset color if current color not available in new size
                            const colorsForSize = exchangeVariants
                              .filter((v) => v.size === size && (v.stock >= exchangeTarget.quantity || (v.size === exchangeTarget.currentSize && v.color === exchangeTarget.currentColor)))
                              .map((v) => v.color);
                            if (!colorsForSize.includes(exchangeColor)) {
                              setExchangeColor(colorsForSize[0] ?? "");
                            }
                          }}
                          className={`px-4 py-2 font-inter text-sm border transition-all duration-150 ${exchangeSize === size ? "border-rose-gold bg-rose-gold/5 text-charcoal" : "border-ivory-200 text-charcoal-light hover:border-charcoal-light"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="font-inter text-xs tracking-widest uppercase text-charcoal-light block mb-2">Select Color</label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setExchangeColor(color)}
                          className={`px-4 py-2 font-inter text-sm border transition-all duration-150 ${exchangeColor === color ? "border-rose-gold bg-rose-gold/5 text-charcoal" : "border-ivory-200 text-charcoal-light hover:border-charcoal-light"}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                    {availableColors.length === 0 && exchangeSize && (
                      <p className="font-inter text-xs text-mauve mt-1">No colors available for this size</p>
                    )}
                  </div>

                  <p className="font-inter text-xs text-mauve">
                    Only available while your order is in <span className="font-medium text-charcoal">PENDING</span> status.
                    Once processing begins, changes are no longer possible.
                  </p>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-ivory-200 flex gap-3 justify-end">
              <button onClick={closeExchange} className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors px-4 py-2">
                Cancel
              </button>
              <Button
                onClick={handleExchange}
                loading={exchangeLoading}
                disabled={
                  variantsLoading ||
                  !exchangeSize ||
                  !exchangeColor ||
                  (exchangeSize === exchangeTarget.currentSize && exchangeColor === exchangeTarget.currentColor)
                }
                size="sm"
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
