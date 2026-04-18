export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminCustomerDetailClient from "@/components/admin/AdminCustomerDetailClient";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.user.findUnique({
    where: { id: params.id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          totalAmount: true,
          discountAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          items: { select: { quantity: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      addresses: {
        select: {
          id: true,
          name: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          pincode: true,
          isDefault: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          product: { select: { name: true, images: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer || customer.name === "[Deleted]") notFound();

  return <AdminCustomerDetailClient customer={customer} />;
}
