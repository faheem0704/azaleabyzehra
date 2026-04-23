export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, string> = {
  "Delivered": "DELIVERED",
  "RTO Initiated": "RETURNED",
  "RTO Delivered": "RETURNED",
  "Cancelled": "CANCELLED",
};

const STATUS_RANK: Record<string, number> = {
  PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3, RETURNED: 4, CANCELLED: 5,
};

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const awb: string = body.awb;
    const currentStatus: string = body.current_status;
    const ourOrderId: string = body.order_id;

    if (!awb || !currentStatus) return NextResponse.json({ received: true });

    const mappedStatus = STATUS_MAP[currentStatus];
    if (!mappedStatus) return NextResponse.json({ received: true });

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: ourOrderId }, { awbCode: awb }] },
    });

    if (!order) return NextResponse.json({ received: true });

    const currentRank = STATUS_RANK[order.status] ?? 0;
    const newRank = STATUS_RANK[mappedStatus] ?? 0;

    if (newRank > currentRank) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: mappedStatus as "DELIVERED" | "RETURNED" | "CANCELLED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Shiprocket webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
