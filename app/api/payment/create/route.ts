export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR" } = await req.json();

    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: `abz_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
