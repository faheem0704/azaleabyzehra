export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyPaymentToken } from "@/lib/paymentToken";
import { createOrder, OrderError } from "@/lib/domain/orderService";

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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const { items, address, selectedAddressId, paymentId, paymentToken, razorpayOrderId, paymentGateway, promoCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // Payment token signature verification — stays at HTTP boundary
    // Without this an attacker can POST with an arbitrary paymentId and get a free PAID order.
    if (paymentId) {
      if (!paymentToken || !razorpayOrderId) {
        return NextResponse.json({ error: "Invalid payment authorization" }, { status: 400 });
      }
      if (!verifyPaymentToken(paymentToken, paymentId, razorpayOrderId)) {
        return NextResponse.json({ error: "Payment authorization is invalid or has expired" }, { status: 400 });
      }
    }

    const { order, slugsToRevalidate } = await createOrder({
      userId,
      items,
      address,
      selectedAddressId,
      paymentId,
      razorpayOrderId,
      paymentGateway,
      promoCode,
    });

    for (const slug of slugsToRevalidate) {
      revalidatePath(`/products/${slug}`);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof OrderError) {
      if (error.stockErrors) {
        return NextResponse.json(
          { error: `Some items are out of stock:\n${error.stockErrors.join("\n")}` },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
