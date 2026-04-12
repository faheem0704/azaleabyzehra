"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Truck } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default function AdminOrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("ALL");

  const updateOrder = async (orderId: string, status: string, trackingId?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingId }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status, trackingId: updated.trackingId } : o)));
      toast.success(status === "SHIPPED" ? "Order marked shipped — customer notified!" : "Order status updated");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Orders</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">{orders.length} total orders</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["ALL", ...STATUS_OPTIONS].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 font-inter text-xs tracking-widest uppercase border transition-all duration-200 ${statusFilter === s ? "bg-charcoal text-ivory border-charcoal" : "border-ivory-200 text-charcoal-light hover:border-charcoal"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white border border-ivory-200 overflow-hidden">
            {/* Row */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-ivory-200/30 transition-colors"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="font-inter text-sm font-medium text-charcoal">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-inter text-xs text-mauve">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-xs text-mauve">Customer</p>
                  <p className="font-inter text-sm text-charcoal">
                    {(order as any).user?.name || (order as any).user?.email || order.guestEmail || "Guest"}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-xs text-mauve">Amount</p>
                  <p className="font-playfair text-sm text-charcoal">{formatPrice(order.totalAmount)}</p>
                </div>
                <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
              </div>
              <div className="flex items-center gap-3">
                {expandedId === order.id ? <ChevronUp size={16} className="text-mauve" /> : <ChevronDown size={16} className="text-mauve" />}
              </div>
            </div>

            {/* Expanded */}
            <AnimatePresence>
              {expandedId === order.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-ivory-200">
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-4">Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-12 flex-shrink-0 bg-ivory-200 overflow-hidden">
                              {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <p className="font-inter text-xs text-charcoal">{item.product?.name}</p>
                              <p className="font-inter text-xs text-mauve">{item.size} · {item.color} × {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Address */}
                      <div className="mt-6">
                        <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-2">Delivery Address</h3>
                        {order.address && (
                          <p className="font-inter text-xs text-charcoal-light leading-relaxed">
                            {(order.address as any).name} · {(order.address as any).phone}<br />
                            {(order.address as any).line1}, {(order.address as any).city}, {(order.address as any).state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div>
                      <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-4">Update Status</h3>
                      <div className="space-y-3 mb-4">
                        {STATUS_OPTIONS.map((s) => (
                          <label key={s} className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-4 h-4 border transition-all ${order.status === s ? "border-rose-gold bg-rose-gold" : "border-ivory-200"}`}>
                              {order.status === s && (
                                <svg viewBox="0 0 16 16" className="w-full h-full text-white" fill="currentColor">
                                  <path d="M6.5 11.5L3 8l1-1 2.5 2.5 6-6 1 1z" />
                                </svg>
                              )}
                            </div>
                            <span className="font-inter text-sm text-charcoal">{s}</span>
                            <button
                              onClick={() => updateOrder(order.id, s, s === "SHIPPED" ? trackingInputs[order.id] : undefined)}
                              disabled={order.status === s || updatingId === order.id}
                              className="ml-auto text-xs font-inter text-rose-gold hover:text-rose-gold-dark disabled:opacity-30 transition-colors"
                            >
                              {order.status === s ? "Current" : "Set"}
                            </button>
                          </label>
                        ))}
                      </div>

                      {/* Tracking ID */}
                      <div className="border-t border-ivory-200 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck size={14} className="text-rose-gold" />
                          <h4 className="font-inter text-xs tracking-widest uppercase text-charcoal-light">Tracking ID</h4>
                        </div>
                        {order.trackingId && (
                          <p className="font-inter text-sm text-charcoal mb-3 font-medium">{order.trackingId}</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter tracking ID"
                            value={trackingInputs[order.id] || ""}
                            onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                            className="flex-1 border border-ivory-200 px-3 py-2 text-sm font-inter focus:outline-none focus:border-rose-gold"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateOrder(order.id, "SHIPPED", trackingInputs[order.id])}
                            disabled={!trackingInputs[order.id] || updatingId === order.id}
                            loading={updatingId === order.id}
                          >
                            Ship
                          </Button>
                        </div>
                        <p className="mt-2 text-xs font-inter text-mauve">Saving tracking ID marks order as Shipped and notifies customer</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white border border-ivory-200">
            <p className="font-inter text-sm text-mauve">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
