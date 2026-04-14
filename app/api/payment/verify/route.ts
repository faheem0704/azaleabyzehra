export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // BUG-07: rate-limit verification attempts (20/min per IP)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`payment-verify:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    return NextResponse.json({ verified: true, paymentId: razorpayPaymentId });
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
