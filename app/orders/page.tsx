export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MainLayout>
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
              {orders.map((order: typeof orders[number]) => (
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
                          {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="font-inter text-xs text-mauve uppercase tracking-widest">Total</p>
                        <p className="font-playfair text-sm text-charcoal">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_COLORS[order.status] || "default"}>
                      {order.status}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4 space-y-4">
                    {order.items.map((item: typeof order.items[number]) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="relative w-14 h-18 flex-shrink-0 bg-ivory-200 overflow-hidden">
                          {item.product.images[0] && (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-inter text-sm text-charcoal line-clamp-1">{item.product.name}</p>
                          <p className="font-inter text-xs text-mauve mt-0.5">{item.size} · {item.color} · Qty: {item.quantity}</p>
                        </div>
                        <p className="font-inter text-sm text-charcoal flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.trackingId && (
                    <div className="border-t border-ivory-200 px-6 py-3 bg-ivory-200/30">
                      <p className="font-inter text-xs text-charcoal-light">
                        Tracking ID: <span className="font-medium text-charcoal">{order.trackingId}</span>
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  <div className="border-t border-ivory-200 px-6 py-3">
                    <p className="font-inter text-xs text-mauve">
                      {order.address.name} · {order.address.line1}, {order.address.city}, {order.address.state}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
