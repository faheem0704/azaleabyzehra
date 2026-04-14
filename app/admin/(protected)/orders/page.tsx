export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    // select only fields AdminOrdersClient needs — avoids fetching full user/product records
    select: {
      id: true, status: true, totalAmount: true, discountAmount: true,
      promoCode: true, paymentStatus: true, paymentGateway: true,
      trackingId: true, createdAt: true,
      user: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          id: true, quantity: true, size: true, color: true, price: true,
          product: { select: { name: true, images: true } },
        },
      },
      address: {
        select: {
          name: true, phone: true, line1: true, line2: true,
          city: true, state: true, pincode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // 50 is enough for the admin view; older orders are filtered by status
  });

  return <AdminOrdersClient orders={orders as any} />;
}
