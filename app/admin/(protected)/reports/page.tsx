export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminReportsClient from "@/components/admin/AdminReportsClient";

export default async function ReportsPage() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [orders, orderItemGroups, statusBreakdown] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: twelveMonthsAgo }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { price: true },
      _count: { id: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  // Monthly buckets
  const monthMap = new Map<string, { revenue: number; orders: number; label: string }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthMap.set(key, { revenue: 0, orders: 0, label });
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      const b = monthMap.get(key)!;
      b.revenue += o.totalAmount;
      b.orders += 1;
    }
  }
  const monthlyRevenue = Array.from(monthMap.values()).map((b) => ({
    ...b,
    revenue: Math.round(b.revenue),
  }));

  // Top products
  const productIds = orderItemGroups.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, images: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const topProducts = orderItemGroups.map((p) => ({
    productId: p.productId,
    name: productMap.get(p.productId)?.name ?? "Unknown",
    image: productMap.get(p.productId)?.images?.[0] ?? null,
    revenue: Math.round(p._sum.price ?? 0),
    orderCount: p._count.id,
  }));

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = orders.length;

  return (
    <AdminReportsClient
      monthlyRevenue={monthlyRevenue}
      topProducts={topProducts}
      statusBreakdown={statusBreakdown.map((s) => ({ status: s.status, count: s._count.id }))}
      summary={{
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      }}
    />
  );
}
