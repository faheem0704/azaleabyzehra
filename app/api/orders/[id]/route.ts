export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendShipmentEmail } from "@/lib/resend";
import { sendShipmentSMS } from "@/lib/twilio";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
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
  const isOwner = order.userId === session?.user?.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(order);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, trackingId } = await req.json();

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      ...(trackingId ? { trackingId } : {}),
    },
    include: {
      user: true,
      address: true,
    },
  });

  // Trigger shipment notifications when status changes to SHIPPED
  if (status === "SHIPPED" && trackingId) {
    const email = order.user?.email || order.guestEmail;
    const phone = order.user?.phone;

    if (email) {
      await sendShipmentEmail(email, order.id, trackingId).catch(console.error);
    }
    if (phone) {
      await sendShipmentSMS(phone, order.id, trackingId).catch(console.error);
    }
  }

  return NextResponse.json(order);
}
