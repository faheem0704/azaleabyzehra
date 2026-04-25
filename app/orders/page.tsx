export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import OrdersPageClient from "@/components/orders/OrdersPageClient";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/orders");

  let orders: any[] = [];
  let fetchError: string | null = null;

  try {
    const result = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // Serialize Dates → ISO strings so the client component receives plain JSON
    orders = JSON.parse(JSON.stringify(result));
  } catch (err) {
    console.error("[orders] fetch failed:", err);
    fetchError = err instanceof Error ? err.message : String(err);
  }

  return (
    <MainLayout>
      <OrdersPageClient orders={orders} fetchError={fetchError} />
    </MainLayout>
  );
}
