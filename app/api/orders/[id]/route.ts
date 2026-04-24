export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendShipmentEmail, sendReviewRequestEmail } from "@/lib/resend";
import { sendShipmentSMS } from "@/lib/twilio";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  // Require at least a valid session before hitting the DB
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const isOwner = order.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(order);
}

// Customer cancellation — only PENDING orders, only own orders
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (order.status !== "PENDING") return NextResponse.json({ error: "Only PENDING orders can be cancelled" }, { status: 400 });

  const items = await prisma.orderItem.findMany({ where: { orderId: params.id } });

  // Stock restore + order status update are atomic — if either fails, neither commits
  const updated = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { productId_size_color: { productId: item.productId, size: item.size, color: item.color } },
      });

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: item.quantity } },
        });
        const total = await tx.productVariant.aggregate({
          where: { productId: item.productId },
          _sum: { stock: true },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: total._sum.stock ?? 0 },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    return tx.order.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
  });

  return NextResponse.json(updated);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, trackingId, courierName } = await req.json();

  const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const current = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });

  // RETURNED: also set paymentStatus to REFUNDED
  const extraData: Record<string, unknown> = {};
  if (status === "RETURNED") {
    extraData.paymentStatus = "REFUNDED";
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      ...(trackingId ? { trackingId } : {}),
      ...(courierName !== undefined ? { courierName } : {}),
      ...extraData,
    },
    include: {
      user: true,
      address: true,
      items: { include: { product: { select: { name: true } } } },
    },
  });

  // Trigger review request when status changes to DELIVERED
  if (status === "DELIVERED" && current?.status !== "DELIVERED") {
    const email = order.user?.email || order.guestEmail;
    if (email) {
      const itemNames = order.items.map((item) => ({ name: item.product.name }));
      sendReviewRequestEmail(email, order.id, itemNames).catch(console.error);
    } else {
      console.warn(`[review-email] No email for order ${order.id} — skipping review request`);
    }
  }

  // Trigger shipment notifications when status changes to SHIPPED
  if (status === "SHIPPED" && trackingId) {
    const email = order.user?.email || order.guestEmail;
    const phone = order.user?.phone;

    if (email) {
      sendShipmentEmail(email, order.id, trackingId, courierName).catch(console.error);
    }
    if (phone) {
      sendShipmentSMS(phone, order.id, trackingId).catch(console.error);
    }
  }

  return NextResponse.json(order);
}
