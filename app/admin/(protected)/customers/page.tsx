export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminCustomersClient from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <AdminCustomersClient customers={customers} />;
}
