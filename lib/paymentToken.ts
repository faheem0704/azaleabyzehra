import crypto from "crypto";

export function issuePaymentToken(paymentId: string, orderId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
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
  const payload = `${tPaymentId}|${tOrderId}|${tExpiry}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // SHA-256 HMAC hex is always 64 chars; reject length mismatch before timingSafeEqual
  if (tSig.length !== expectedSig.length) return false;
  const sigMatch = crypto.timingSafeEqual(Buffer.from(tSig, "hex"), Buffer.from(expectedSig, "hex"));
  if (!sigMatch) return false;
  if (tPaymentId !== paymentId) return false;
  if (tOrderId !== razorpayOrderId) return false;
  if (Math.floor(Date.now() / 1000) > parseInt(tExpiry, 10)) return false;
  return true;
}
