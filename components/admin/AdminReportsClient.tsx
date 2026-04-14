"use client";

import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Package, BarChart2 } from "lucide-react";

interface MonthData { label: string; revenue: number; orders: number; }
interface TopProduct { productId: string; name: string; image: string | null; revenue: number; orderCount: number; }
interface StatusData { status: string; count: number; }
interface Summary { totalRevenue: number; totalOrders: number; avgOrderValue: number; }

interface Props {
  monthlyRevenue: MonthData[];
  topProducts: TopProduct[];
  statusBreakdown: StatusData[];
  summary: Summary;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-400",
  PROCESSING: "bg-blue-400",
  SHIPPED: "bg-purple-400",
  DELIVERED: "bg-green-400",
  CANCELLED: "bg-red-400",
};

export default function AdminReportsClient({ monthlyRevenue, topProducts, statusBreakdown, summary }: Props) {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
  const totalStatusCount = statusBreakdown.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-playfair text-3xl text-charcoal">Reports</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">Last 12 months · excluding cancelled orders</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatPrice(summary.totalRevenue), icon: TrendingUp, color: "text-rose-gold" },
          { label: "Total Orders", value: summary.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-500" },
          { label: "Avg Order Value", value: formatPrice(summary.avgOrderValue), icon: BarChart2, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-ivory-200 p-6 flex items-center gap-4">
            <div className={`p-3 bg-ivory-200 rounded-full ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-inter text-xs tracking-widest uppercase text-charcoal-light">{label}</p>
              <p className="font-playfair text-2xl text-charcoal mt-1">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white border border-ivory-200 p-6">
        <h2 className="font-playfair text-xl text-charcoal mb-6">Monthly Revenue</h2>
        <div className="flex items-end gap-2 h-48">
          {monthlyRevenue.map((m) => {
            const heightPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-charcoal text-ivory text-xs font-inter px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-medium">{formatPrice(m.revenue)}</p>
                  <p className="text-ivory/60">{m.orders} orders</p>
                </div>
                <div
                  className="w-full bg-rose-gold/80 hover:bg-rose-gold transition-colors rounded-t-sm"
                  style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 2 : 0)}%` }}
                />
                <span className="font-inter text-[9px] text-mauve">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-ivory-200 p-6">
          <h2 className="font-playfair text-xl text-charcoal mb-6 flex items-center gap-2">
            <Package size={18} className="text-rose-gold" />
            Top 5 Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="font-inter text-sm text-mauve">No order data yet</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="font-playfair text-2xl text-ivory-200 w-7 flex-shrink-0">{i + 1}</span>
                  {p.image && (
                    <div className="w-10 h-12 flex-shrink-0 bg-ivory-200 overflow-hidden">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-sm text-charcoal truncate">{p.name}</p>
                    <p className="font-inter text-xs text-mauve">{p.orderCount} orders</p>
                  </div>
                  <span className="font-inter text-sm font-medium text-charcoal flex-shrink-0">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white border border-ivory-200 p-6">
          <h2 className="font-playfair text-xl text-charcoal mb-6 flex items-center gap-2">
            <ShoppingCart size={18} className="text-rose-gold" />
            Orders by Status
          </h2>
          {statusBreakdown.length === 0 ? (
            <p className="font-inter text-sm text-mauve">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {statusBreakdown
                .sort((a, b) => b.count - a.count)
                .map(({ status, count }) => {
                  const pct = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between font-inter text-sm mb-1.5">
                        <span className="text-charcoal">{status}</span>
                        <span className="text-charcoal-light">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 bg-ivory-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status] ?? "bg-charcoal-light"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
