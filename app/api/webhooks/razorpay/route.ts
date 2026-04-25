export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendNewOrderAlert } from "@/lib/resend";
import { sendOrderConfirmationSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const sigBuf = Buffer.from(signature.padEnd(64, "0"), "hex");
  const expBuf = Buffer.from(expected, "hex");
  const valid =
    signature.length === expected.length &&
    sigBuf.length === expBuf.length &&
    crypto.timingSafeEqual(sigBuf, expBuf);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const razorpayOrderId: string = payment.order_id;
    const razorpayPaymentId: string = payment.id;

    // Find the order by razorpayOrderId — only act if it's still PENDING
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId, status: "PENDING" },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, phone: true, name: true } },
        address: true,
      },
    });

    if (!order) {
      // Already processed by the client-side verify flow, or unknown order — safe to ignore
      return NextResponse.json({ received: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PROCESSING", paymentStatus: "PAID", paymentId: razorpayPaymentId },
    });

    // Send confirmation emails/SMS fire-and-forget
    const email = order.user?.email;
    const phone = order.user?.phone;
    const orderData = {
      id: order.id,
      items: order.items.map((i: { product: { name: string }; quantity: number; price: number; size: string; color: string }) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
      })),
      totalAmount: order.totalAmount,
      address: {
        name: order.address.name,
        line1: order.address.line1,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
      },
    };

    if (email) sendOrderConfirmationEmail(email, orderData).catch(console.error);
    if (phone) sendOrderConfirmationSMS(phone, order.id).catch(console.error);

    // Admin alert
    const settings = await prisma.settings.findFirst().catch(() => null);
    if (settings?.adminEmail) {
      sendNewOrderAlert(settings.adminEmail, {
        id: order.id,
        customerName: order.user?.name ?? "Guest",
        customerContact: email ?? phone ?? "unknown",
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
