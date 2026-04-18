"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Star, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

type CustomerDetail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  orders: {
    id: string;
    totalAmount: number;
    discountAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    items: { quantity: number; price: number }[];
  }[];
  addresses: {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    product: { name: string; images: string[] };
  }[];
};

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

export default function AdminCustomerDetailClient({ customer }: { customer: CustomerDetail }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const paidOrders = customer.orders.filter((o) => o.paymentStatus === "PAID");
  const lifetimeValue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = paidOrders.length > 0 ? lifetimeValue / paidOrders.length : 0;
  const lastOrder = customer.orders[0];
  const initials = customer.name?.[0] || customer.email?.[0] || "?";

  const handleDelete = async () => {
    const label = customer.email || customer.name || customer.id;
    if (!confirm(`Remove "${label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Customer removed");
      router.push("/admin/customers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 font-inter text-sm text-charcoal-light hover:text-rose-gold transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </Link>

      {/* Header */}
      <div className="bg-white border border-ivory-200 p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-gold/20 flex items-center justify-center font-playfair text-xl text-rose-gold font-medium flex-shrink-0">
            {initials.toUpperCase()}
          </div>
          <div>
            <h1 className="font-playfair text-2xl text-charcoal">{customer.name || "—"}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {customer.email && (
                <span className="flex items-center gap-1.5 font-inter text-sm text-charcoal-light">
                  <Mail size={12} className="text-mauve" />
                  {customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1.5 font-inter text-sm text-charcoal-light">
                  <Phone size={12} className="text-mauve" />
                  {customer.phone}
                </span>
              )}
            </div>
            <p className="font-inter text-xs text-mauve mt-1">
              Customer since{" "}
              {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 font-inter text-xs text-mauve hover:text-red-500 transition-colors border border-ivory-200 px-3 py-2 disabled:opacity-40 flex-shrink-0"
          title="Delete customer"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: customer.orders.length.toString(), icon: ShoppingBag },
          { label: "Lifetime Value", value: formatPrice(lifetimeValue), icon: null },
          { label: "Avg Order Value", value: paidOrders.length > 0 ? formatPrice(avgOrderValue) : "—", icon: null },
          {
            label: "Last Order",
            value: lastOrder
              ? new Date(lastOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—",
            icon: null,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-ivory-200 p-5">
            <p className="font-inter text-xs tracking-widest uppercase text-mauve">{stat.label}</p>
            <p className="font-playfair text-2xl text-charcoal mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div className="bg-white border border-ivory-200">
        <div className="px-6 py-4 border-b border-ivory-200">
          <h2 className="font-inter text-xs tracking-widest uppercase text-charcoal">Order History</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-inter text-sm text-mauve">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-ivory-200">
            {customer.orders.map((order) => {
              const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-inter text-xs text-mauve font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="font-inter text-sm text-charcoal mt-0.5">
                      {itemCount} item{itemCount !== 1 ? "s" : ""} · {formatPrice(order.totalAmount)}
                      {order.discountAmount > 0 && (
                        <span className="text-mauve ml-1 text-xs">(-{formatPrice(order.discountAmount)})</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
                    <Badge variant={PAYMENT_COLORS[order.paymentStatus] || "default"}>{order.paymentStatus}</Badge>
                    <span className="font-inter text-xs text-mauve">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Addresses */}
      {customer.addresses.length > 0 && (
        <div>
          <h2 className="font-inter text-xs tracking-widest uppercase text-charcoal mb-3">Saved Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="bg-white border border-ivory-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-mauve" />
                    <span className="font-inter text-sm font-medium text-charcoal">{addr.name}</span>
                  </div>
                  {addr.isDefault && (
                    <span className="font-inter text-xs text-rose-gold">Default</span>
                  )}
                </div>
                <p className="font-inter text-xs text-charcoal-light leading-relaxed">
                  {addr.line1}
                  {addr.line2 && `, ${addr.line2}`}
                  <br />
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {customer.reviews.length > 0 && (
        <div className="bg-white border border-ivory-200">
          <div className="px-6 py-4 border-b border-ivory-200">
            <h2 className="font-inter text-xs tracking-widest uppercase text-charcoal">Reviews Left</h2>
          </div>
          <div className="divide-y divide-ivory-200">
            {customer.reviews.map((review) => (
              <div key={review.id} className="px-6 py-4 flex items-start gap-4">
                {review.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.product.images[0]}
                    alt={review.product.name}
                    className="w-12 h-12 object-cover flex-shrink-0 border border-ivory-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-inter text-sm text-charcoal">{review.product.name}</p>
                    <span className="font-inter text-xs text-mauve">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-ivory-200 fill-ivory-200"}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="font-inter text-sm text-charcoal-light mt-1">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
