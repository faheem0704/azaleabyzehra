export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminReportsClient from "@/components/admin/AdminReportsClient";

export default async function ReportsPage() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // SQL aggregation: bucket revenue + order count by month in a single query
  // NOTE: Prisma maps camelCase field names directly to the DB without snake_case conversion,
  // so the actual PostgreSQL columns are "totalAmount" and "createdAt" (quoted camelCase).
  type MonthRow = { month: Date; revenue: number; order_count: bigint };
  const [monthRows, orderItemGroups, statusBreakdown, summaryRow] = await Promise.all([
    prisma.$queryRaw<MonthRow[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        SUM("totalAmount")               AS revenue,
        COUNT(*)                         AS order_count
      FROM orders
      WHERE "createdAt" >= ${twelveMonthsAgo}
        AND status != 'CANCELLED'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `,
    // Sum price × quantity for true revenue per product (groupBy can't do computed expressions)
    prisma.$queryRaw<{ productId: string; revenue: number; orderCount: bigint }[]>`
      SELECT
        "productId",
        SUM(price * quantity)::float AS revenue,
        COUNT(DISTINCT "orderId")   AS "orderCount"
      FROM order_items
      GROUP BY "productId"
      ORDER BY revenue DESC
      LIMIT 5
    `,
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.$queryRaw<{ total_revenue: number; total_orders: bigint }[]>`
      SELECT SUM("totalAmount") AS total_revenue, COUNT(*) AS total_orders
      FROM orders
      WHERE "createdAt" >= ${twelveMonthsAgo}
        AND status != 'CANCELLED'
    `,
  ]);

  // Build the 12-month chart array (fill gaps with 0)
  const monthMap = new Map<string, { revenue: number; orders: number; label: string }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthMap.set(key, { revenue: 0, orders: 0, label });
  }
  for (const row of monthRows) {
    const d = new Date(row.month);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.get(key)!.revenue = Math.round(Number(row.revenue));
      monthMap.get(key)!.orders = Number(row.order_count);
    }
  }
  const monthlyRevenue = Array.from(monthMap.values());

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
    revenue: Math.round(Number(p.revenue) ?? 0),
    orderCount: Number(p.orderCount),
  }));

  const totalRevenue = Math.round(Number(summaryRow[0]?.total_revenue ?? 0));
  const totalOrders = Number(summaryRow[0]?.total_orders ?? 0);

  return (
    <AdminReportsClient
      monthlyRevenue={monthlyRevenue}
      topProducts={topProducts}
      statusBreakdown={statusBreakdown.map((s) => ({ status: s.status, count: s._count.id }))}
      summary={{
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      }}
    />
  );
}
