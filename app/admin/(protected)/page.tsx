export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

async function getDashboardData() {
  const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders, settings] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, totalAmount: true, createdAt: true,
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.settings.findFirst({ select: { lowStockThreshold: true } }),
  ]);

  const threshold = settings?.lowStockThreshold ?? 5;
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lt: threshold }, isDeleted: false },
    select: { id: true, name: true, stock: true, images: true },
    take: 5,
  });

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
