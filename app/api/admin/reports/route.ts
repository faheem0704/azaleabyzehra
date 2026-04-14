export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [orders, topProducts, statusBreakdown] = await Promise.all([
    // All orders in last 12 months (non-cancelled)
    prisma.order.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true, createdAt: true },
    }),

    // Top products by total revenue
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { price: true },
      _count: { id: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),

    // Orders by status (all time)
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Monthly revenue buckets
  const monthMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      const bucket = monthMap.get(key)!;
      bucket.revenue += o.totalAmount;
      bucket.orders += 1;
    }
  }

  const monthlyRevenue = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue),
    orders: data.orders,
  }));

  // Resolve product names
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, images: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const topProductsWithNames = topProducts.map((p) => ({
    productId: p.productId,
    name: productMap.get(p.productId)?.name ?? "Unknown",
    image: productMap.get(p.productId)?.images?.[0] ?? null,
    revenue: Math.round(p._sum.price ?? 0),
    orderCount: p._count.id,
  }));

  // Summary stats
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return NextResponse.json({
    monthlyRevenue,
    topProducts: topProductsWithNames,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.id })),
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
    },
  });
}
