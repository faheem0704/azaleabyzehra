export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { sendOrderConfirmationSMS } from "@/lib/twilio";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (!isAdmin) {
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    where.userId = session.user.id;
  }

  if (status) where.status = status;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, images: true, slug: true } } } },
        address: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items, address, totalAmount, guestEmail, paymentId, paymentGateway } = body;

    // Create or find address
    let addressRecord;
    if (session?.user?.id) {
      addressRecord = await prisma.address.create({
        data: { ...address, userId: session.user.id },
      });
    } else {
      // Guest: still need address, create with temp user or attach to order differently
      // For simplicity, we'll create a guest address linked to first user (in production, handle differently)
      const guestUser = await prisma.user.upsert({
        where: { email: guestEmail },
        update: {},
        create: { email: guestEmail },
      });
      addressRecord = await prisma.address.create({
        data: { ...address, userId: guestUser.id },
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        guestEmail: guestEmail || null,
        totalAmount,
        addressId: addressRecord.id,
        paymentId: paymentId || null,
        paymentStatus: paymentId ? "PAID" : "PENDING",
        paymentGateway: paymentGateway || null,
        items: {
          create: items.map((item: {
            productId: string;
            quantity: number;
            size: string;
            color: string;
            price: number;
          }) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        address: true,
        user: true,
      },
    });

    // Send notifications
    const contactEmail = order.user?.email || guestEmail;
    const contactPhone = order.user?.phone;

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
        name: addressRecord.name,
        line1: addressRecord.line1,
        city: addressRecord.city,
        state: addressRecord.state,
        pincode: addressRecord.pincode,
      },
    };

    if (contactEmail) {
      await sendOrderConfirmationEmail(contactEmail, orderData).catch(console.error);
    }
    if (contactPhone) {
      await sendOrderConfirmationSMS(contactPhone, order.id).catch(console.error);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
