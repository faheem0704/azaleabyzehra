export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

async function getDashboardData() {
  const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders, lowStockProducts] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, items: { select: { quantity: true } } },
    }),
    prisma.product.findMany({
      where: { stock: { lt: 5 }, isDeleted: false },
      select: { id: true, name: true, stock: true, images: true },
      take: 5,
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    lowStockProducts,
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  return <AdminDashboardClient {...data} />;
}
