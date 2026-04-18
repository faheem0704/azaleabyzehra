export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

const PAGE_SIZE = 20;

interface Props {
  searchParams: { page?: string };
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const currentPage = Math.max(1, parseInt(searchParams.page || "1"));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [totalCount, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      select: {
        id: true, status: true, totalAmount: true, discountAmount: true,
        promoCode: true, paymentStatus: true, paymentGateway: true,
        trackingId: true, createdAt: true, guestEmail: true,
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            id: true, quantity: true, size: true, color: true, price: true, sku: true,
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
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  return <AdminOrdersClient orders={orders as any} totalCount={totalCount} currentPage={currentPage} pageSize={PAGE_SIZE} />;
}
