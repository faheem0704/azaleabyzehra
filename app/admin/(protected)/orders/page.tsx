export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <AdminOrdersClient orders={orders as any} />;
}
