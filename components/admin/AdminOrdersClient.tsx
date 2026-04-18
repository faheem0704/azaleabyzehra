"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Truck, Printer, MessageCircle, RotateCcw } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
const PAYMENT_OPTIONS = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"];

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};

const PAYMENT_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "default",
};

type DateRange = "all" | "today" | "7d" | "30d";

function buildWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  // Add country code if missing (assume India)
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

interface AdminOrdersClientProps {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export default function AdminOrdersClient({ orders: initialOrders, totalCount, currentPage, pageSize }: AdminOrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange>("all");

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
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: updated.status, trackingId: updated.trackingId, paymentStatus: updated.paymentStatus }
            : o
        )
      );
      const messages: Record<string, string> = {
        SHIPPED: "Order marked shipped — customer notified!",
        RETURNED: "Order marked as returned & refunded",
        CANCELLED: "Order cancelled",
        DELIVERED: "Order marked as delivered",
      };
      toast.success(messages[status] || "Order status updated");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = orders;

    if (statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter !== "ALL") {
      result = result.filter((o) => (o as any).paymentStatus === paymentFilter);
    }

    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === "7d") {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateRange === "30d") {
        cutoff.setDate(now.getDate() - 30);
      }
      result = result.filter((o) => new Date(o.createdAt) >= cutoff);
    }

    return result;
  }, [orders, statusFilter, paymentFilter, dateRange]);

  const printLabel = (order: Order) => {
    const addr = order.address as any;
    const customerName = (order as any).user?.name || (order as any).user?.email || order.guestEmail || "Guest";
    const items = order.items.map((item: any) =>
      `${item.product?.name} — ${item.size} · ${item.color} × ${item.quantity} @ ₹${item.price}`
    ).join("\n");

    const win = window.open("", "_blank", "width=700,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label — #${order.id.slice(-8).toUpperCase()}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    .label { border: 2px solid #111; padding: 24px; max-width: 560px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: bold; }
    .order-id { font-size: 14px; color: #555; }
    h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 0 0 6px; }
    p { margin: 2px 0; font-size: 14px; line-height: 1.5; }
    .section { margin-bottom: 16px; }
    .items { background: #f9f9f9; padding: 12px; font-size: 13px; white-space: pre-line; }
    .total { font-size: 16px; font-weight: bold; margin-top: 12px; }
    .footer { margin-top: 20px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <div class="brand">Azalea by Zehra</div>
      <div class="order-id">Order #${order.id.slice(-8).toUpperCase()}<br/>${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
    </div>
    <div class="section">
      <h3>Ship To</h3>
      <p><strong>${addr?.name || customerName}</strong></p>
      <p>${addr?.phone || ""}</p>
      <p>${addr?.line1 || ""}${addr?.line2 ? ", " + addr.line2 : ""}</p>
      <p>${addr?.city || ""}${addr?.state ? ", " + addr.state : ""} — ${addr?.pincode || ""}</p>
    </div>
    <div class="section">
      <h3>Order Items</h3>
      <div class="items">${items}</div>
    </div>
    ${order.trackingId ? `<div class="section"><h3>Tracking ID</h3><p>${order.trackingId}</p></div>` : ""}
    <p class="total">Total: ₹${order.totalAmount.toFixed(2)}${(order as any).discountAmount > 0 ? ` (Discount: ₹${(order as any).discountAmount.toFixed(2)})` : ""}</p>
    <div class="footer">Printed from Azalea by Zehra Admin Panel</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Orders</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">{totalCount} total · {filtered.length} shown this page</p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 font-inter text-xs tracking-widest uppercase border transition-all duration-200 ${
                statusFilter === s
                  ? "bg-charcoal text-ivory border-charcoal"
                  : "border-ivory-200 text-charcoal-light hover:border-charcoal"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Payment + Date filters in one row */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="font-inter text-xs text-mauve tracking-widest uppercase">Payment:</span>
            <div className="flex gap-1.5 flex-wrap">
              {PAYMENT_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPaymentFilter(p)}
                  className={`px-3 py-1.5 font-inter text-xs border transition-all duration-200 ${
                    paymentFilter === p
                      ? "bg-rose-gold text-white border-rose-gold"
                      : "border-ivory-200 text-charcoal-light hover:border-rose-gold hover:text-rose-gold"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-inter text-xs text-mauve tracking-widest uppercase">Date:</span>
            <div className="flex gap-1.5">
              {(["all", "today", "7d", "30d"] as DateRange[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1.5 font-inter text-xs border transition-all duration-200 ${
                    dateRange === d
                      ? "bg-rose-gold text-white border-rose-gold"
                      : "border-ivory-200 text-charcoal-light hover:border-rose-gold hover:text-rose-gold"
                  }`}
                >
                  {d === "all" ? "All" : d === "today" ? "Today" : d === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const addr = order.address as any;
          const customerPhone = addr?.phone || (order as any).user?.phone || "";
          const customerName = (order as any).user?.name || (order as any).user?.email || order.guestEmail || "Guest";
          const orderRef = `#${order.id.slice(-8).toUpperCase()}`;

          return (
            <div key={order.id} className="bg-white border border-ivory-200 overflow-hidden">
              {/* Row */}
              <div
                className="flex items-start justify-between px-4 md:px-6 py-4 cursor-pointer hover:bg-ivory-200/30 transition-colors gap-3"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-wrap flex-1 min-w-0">
                  <div className="flex items-center gap-3 md:block">
                    <p className="font-inter text-sm font-medium text-charcoal">{orderRef}</p>
                    <p className="font-inter text-xs text-mauve">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:block">
                    <p className="font-inter text-xs text-mauve hidden md:block">Customer</p>
                    <p className="font-inter text-sm text-charcoal truncate max-w-[160px] md:max-w-none">
                      {customerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:block">
                    <p className="font-inter text-xs text-mauve hidden md:block">Amount</p>
                    <p className="font-playfair text-sm text-charcoal">{formatPrice(order.totalAmount)}</p>
                  </div>
                  <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
                  {(order as any).paymentStatus && (order as any).paymentStatus !== "PAID" && (
                    <Badge variant={PAYMENT_COLORS[(order as any).paymentStatus] || "default"}>
                      {(order as any).paymentStatus}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center flex-shrink-0 pt-0.5">
                  {expandedId === order.id ? <ChevronUp size={16} className="text-mauve" /> : <ChevronDown size={16} className="text-mauve" />}
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {expandedId === order.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-ivory-200">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items + Address + WhatsApp */}
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
                                {item.sku && (
                                  <p className="font-inter text-[10px] text-charcoal-light tracking-wider mt-0.5">SKU: {item.sku}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Address */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light">Delivery Address</h3>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => printLabel(order)}
                                className="flex items-center gap-1.5 text-xs font-inter text-rose-gold hover:text-rose-gold-dark transition-colors"
                              >
                                <Printer size={13} />
                                Label
                              </button>
                              <a
                                href={`/admin/orders/${order.id}/invoice`}
                                target="_blank"
                                className="flex items-center gap-1.5 text-xs font-inter text-charcoal-light hover:text-charcoal transition-colors"
                              >
                                <Printer size={13} />
                                Invoice
                              </a>
                            </div>
                          </div>
                          {order.address && (() => {
                            return (
                              <div className="font-inter text-xs text-charcoal-light leading-relaxed space-y-0.5">
                                <p className="font-medium text-charcoal">{addr?.name}</p>
                                <p>{addr?.phone}</p>
                                <p>{addr?.line1}{addr?.line2 ? `, ${addr.line2}` : ""}</p>
                                <p>{addr?.city}, {addr?.state}</p>
                                <p className="font-medium text-charcoal">PIN: {addr?.pincode}</p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* WhatsApp buttons */}
                        {customerPhone && (
                          <div className="mt-5 border-t border-ivory-200 pt-4">
                            <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-3 flex items-center gap-2">
                              <MessageCircle size={12} className="text-green-500" />
                              WhatsApp Customer
                            </h3>
                            <div className="flex flex-col gap-2">
                              <a
                                href={buildWhatsAppUrl(
                                  customerPhone,
                                  `Hi ${addr?.name || customerName}! 👋 Thank you for your order ${orderRef} at Azalea by Zehra. Your order has been confirmed and is being processed. We'll notify you once it ships! 🛍️`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-inter hover:bg-green-100 transition-colors"
                              >
                                <MessageCircle size={13} />
                                Order Confirmation
                              </a>
                              {order.trackingId && (
                                <a
                                  href={buildWhatsAppUrl(
                                    customerPhone,
                                    `Hi ${addr?.name || customerName}! Your Azalea by Zehra order ${orderRef} has been shipped! 📦\nTracking ID: ${order.trackingId}\nExpected delivery: 5–14 business days.\nTrack your order at azaleabyzehra.com/orders 🌸`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-inter hover:bg-green-100 transition-colors"
                                >
                                  <MessageCircle size={13} />
                                  Shipping Update
                                </a>
                              )}
                              <a
                                href={buildWhatsAppUrl(
                                  customerPhone,
                                  `Hi ${addr?.name || customerName}! We noticed an issue with your order ${orderRef}. Could you please reach out to us so we can assist you? Thank you 🙏`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 border border-ivory-200 text-charcoal-light text-xs font-inter hover:border-green-200 hover:text-green-700 transition-colors"
                              >
                                <MessageCircle size={13} />
                                Custom / Support
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Update */}
                      <div>
                        <h3 className="font-inter text-xs tracking-widest uppercase text-charcoal-light mb-4">Update Status</h3>
                        <div className="space-y-3 mb-4">
                          {STATUS_OPTIONS.map((s) => (
                            <label key={s} className="flex items-center gap-3 cursor-pointer">
                              <div className={`w-4 h-4 border transition-all flex-shrink-0 ${order.status === s ? "border-rose-gold bg-rose-gold" : "border-ivory-200"}`}>
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

                        {/* Mark Returned & Refunded shortcut */}
                        {order.status !== "RETURNED" && order.status !== "CANCELLED" && (
                          <div className="mb-4 border border-dashed border-rose-gold/40 p-3">
                            <button
                              onClick={() => {
                                if (confirm(`Mark order ${orderRef} as RETURNED and set payment status to REFUNDED?`)) {
                                  updateOrder(order.id, "RETURNED");
                                }
                              }}
                              disabled={updatingId === order.id}
                              className="flex items-center gap-2 text-xs font-inter text-rose-gold hover:text-rose-gold-dark transition-colors disabled:opacity-40"
                            >
                              <RotateCcw size={13} />
                              Mark as Returned & Refunded
                            </button>
                            <p className="mt-1 text-[11px] font-inter text-mauve">Sets status to RETURNED and payment to REFUNDED</p>
                          </div>
                        )}

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
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white border border-ivory-200">
            <p className="font-inter text-sm text-mauve">No orders match these filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between mt-8">
          <p className="font-inter text-sm text-mauve">
            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/orders?page=${currentPage - 1}`)}
              disabled={currentPage <= 1}
              className="px-4 py-2 font-inter text-sm border border-ivory-200 text-charcoal hover:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <button
              onClick={() => router.push(`/admin/orders?page=${currentPage + 1}`)}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              className="px-4 py-2 font-inter text-sm border border-ivory-200 text-charcoal hover:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
