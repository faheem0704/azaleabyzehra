export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { checkRateLimit } from "@/lib/rateLimit";
import { auth } from "@/lib/auth";

// Issue a short-lived HMAC token so /api/orders can confirm that this
// server actually verified the Razorpay signature — preventing an attacker
// from calling /api/orders directly with an arbitrary paymentId string.
function issuePaymentToken(paymentId: string, orderId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  // Token encodes: paymentId + razorpayOrderId + expiry (5 min window)
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const payload = `${paymentId}|${orderId}|${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}|${sig}`;
}

export function verifyPaymentToken(token: string, paymentId: string, razorpayOrderId: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  const parts = token.split("|");
  if (parts.length !== 4) return false;
  const [tPaymentId, tOrderId, tExpiry, tSig] = parts;
  // Constant-time compare to prevent timing attacks.
  // SHA-256 HMAC hex is always 64 chars; reject any token with a different-length sig
  // before calling timingSafeEqual to avoid a length-mismatch throw.
  const payload = `${tPaymentId}|${tOrderId}|${tExpiry}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (tSig.length !== expectedSig.length) return false;
  const sigMatch = crypto.timingSafeEqual(Buffer.from(tSig, "hex"), Buffer.from(expectedSig, "hex"));
  if (!sigMatch) return false;
  if (tPaymentId !== paymentId) return false;
  if (tOrderId !== razorpayOrderId) return false;
  if (Math.floor(Date.now() / 1000) > parseInt(tExpiry, 10)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit verification attempts (5/min per user — tighter than IP since we now require auth)
  if (!checkRateLimit(`payment-verify:${session.user.id}`, 5, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment parameters" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Issue a short-lived server-signed token. /api/orders will verify this token
    // before treating the paymentId as genuinely paid — an attacker who skips
    // /api/payment/verify cannot forge this token without NEXTAUTH_SECRET.
    const paymentToken = issuePaymentToken(razorpayPaymentId, razorpayOrderId);

    return NextResponse.json({ verified: true, paymentId: razorpayPaymentId, paymentToken });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
