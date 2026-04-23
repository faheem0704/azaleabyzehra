export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createShipment, generateAWB, requestPickup } from "@/lib/shiprocket";
import { sendShipmentEmail } from "@/lib/resend";
import { sendShipmentSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, pickupLocation, weight, schedulePickup = true } = await req.json();

    if (!orderId || !pickupLocation || !weight) {
      return NextResponse.json({ error: "orderId, pickupLocation and weight are required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        user: { select: { email: true, phone: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.awbCode) return NextResponse.json({ error: "Shipment already created for this order" }, { status: 409 });

    const addr = order.address;
    const customerName = order.user?.name || addr.name;
    const email = order.user?.email || order.guestEmail || "";
    const phone = order.user?.phone || addr.phone;

    const { order_id: srOrderId, shipment_id: srShipmentId } = await createShipment({
      orderId: order.id,
      orderDate: new Date(order.createdAt).toISOString().replace("T", " ").slice(0, 16),
      pickupLocation,
      customerName,
      address: `${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}`,
      city: addr.city,
      pincode: addr.pincode,
      state: addr.state,
      phone: addr.phone,
      email,
      items: order.items.map((i: { id: string; quantity: number; price: number; product: { name: string } }) => ({
        name: i.product.name,
        sku: i.id.slice(-8),
        units: i.quantity,
        selling_price: i.price,
      })),
      paymentMethod: order.paymentGateway === "COD" ? "COD" : "Prepaid",
      subTotal: order.totalAmount,
      weight: parseFloat(String(weight)),
    });

    const { awb_code, courier_name } = await generateAWB(srShipmentId);

    if (schedulePickup) {
      requestPickup(srShipmentId).catch(console.error);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingId: awb_code,
        awbCode: awb_code,
        courierName: courier_name,
        shiprocketOrderId: String(srOrderId),
        shiprocketShipmentId: String(srShipmentId),
        pickupLocation,
      },
    });

    if (email) sendShipmentEmail(email, order.id, awb_code).catch(console.error);
    if (phone) sendShipmentSMS(phone, order.id, awb_code).catch(console.error);

    return NextResponse.json({ awbCode: awb_code, courierName: courier_name, shiprocketOrderId: srOrderId });
  } catch (err) {
    console.error("Shiprocket shipment error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Shipment creation failed" }, { status: 500 });
  }
}
