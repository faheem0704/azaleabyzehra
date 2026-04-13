"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface Props {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    user: { name: string | null; email: string | null } | null;
    items: { quantity: number }[];
  }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number; images: string[] }>;
}

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default function AdminDashboardClient({ totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders, lowStockProducts }: Props) {
  const stats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), icon: TrendingUp, color: "text-rose-gold" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-blue-500" },
    { label: "Customers", value: totalCustomers.toLocaleString(), icon: Users, color: "text-green-500" },
    { label: "Products", value: totalProducts.toLocaleString(), icon: Package, color: "text-purple-500" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Dashboard</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">Welcome back, Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-ivory-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light">{stat.label}</p>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="font-playfair text-2xl text-charcoal">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-ivory-200 p-6">
          <h2 className="font-playfair text-xl text-charcoal mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-start justify-between py-3 border-b border-ivory-200 last:border-0 gap-3">
                <div className="min-w-0">
                  <p className="font-inter text-sm font-medium text-charcoal">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-inter text-xs text-mauve mt-0.5 truncate">
                    {order.user?.name || order.user?.email || "Guest"} · {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
                  <span className="font-inter text-sm text-charcoal">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="font-inter text-sm text-mauve text-center py-8">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white border border-ivory-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-playfair text-xl text-charcoal">Low Stock Alert</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="font-inter text-sm text-mauve text-center py-8">All products are well-stocked</p>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-12 flex-shrink-0 bg-ivory-200 overflow-hidden">
                    {product.images[0] && (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-xs text-charcoal line-clamp-1">{product.name}</p>
                    <p className={`font-inter text-xs mt-0.5 ${product.stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                      {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
