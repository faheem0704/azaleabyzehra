export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { checkRateLimit } from "@/lib/rateLimit";
import { auth } from "@/lib/auth";
import { issuePaymentToken } from "@/lib/paymentToken";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`payment-verify:${session.user.id}`, 5, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment parameters" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const paymentToken = issuePaymentToken(razorpayPaymentId, razorpayOrderId);
    return NextResponse.json({ verified: true, paymentId: razorpayPaymentId, paymentToken });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
