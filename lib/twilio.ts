// SMS delivery via 2Factor.in (simple Indian SMS gateway, no DLT registration needed)
// File kept as twilio.ts so existing imports don't need to change.
// API docs: https://2factor.in/API/

// 2Factor uses a simple GET API for OTP and a transactional SMS API for notifications.
// OTP API has built-in template — no setup needed other than the API key.
// For order/shipment SMS, uses the transactional route with a shared sender ID.

const BASE = "https://2factor.in/API/V1";

function getApiKey(): string {
  const key = process.env.TWOFACTOR_API_KEY;
  if (!key) throw new Error("TWOFACTOR_API_KEY not configured");
  return key;
}

// 2Factor expects Indian numbers without country code (10 digits)
// or with +91 prefix. Normalise to 10-digit format.
function formatMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits; // pass through for non-Indian numbers
}

// OTP SMS — 2Factor has a dedicated OTP API with built-in delivery and retry.
// No template registration needed. Message format is fixed:
// "<OTP> is your One Time Password(OTP) for Azalea by Zehra. OTP is valid for 10 minutes."
// To use a custom message, set TWOFACTOR_OTP_TEMPLATE_NAME in env vars
// (requires creating a template in 2Factor dashboard).
export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  const apiKey = getApiKey();
  const mobile = formatMobile(phone);
  const templateName = process.env.TWOFACTOR_OTP_TEMPLATE_NAME || ""; // optional custom template

  const url = templateName
    ? `${BASE}/${apiKey}/SMS/${mobile}/${otp}/${templateName}`
    : `${BASE}/${apiKey}/SMS/${mobile}/${otp}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== "Success") {
    throw new Error(`2Factor OTP error: ${data.Details || JSON.stringify(data)}`);
  }
}

// Transactional SMS — used for order confirmation and shipment notifications.
// Requires creating templates in 2Factor dashboard under Transactional SMS.
// Set TWOFACTOR_ORDER_TEMPLATE and TWOFACTOR_SHIPMENT_TEMPLATE env vars
// with the exact template name from your 2Factor dashboard.
async function sendTransactionalSMS(phone: string, message: string): Promise<void> {
  const apiKey = getApiKey();
  const mobile = formatMobile(phone);

  const url = `${BASE}/${apiKey}/ADDON_SERVICES/SEND/TSMS`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      From: process.env.TWOFACTOR_SENDER_ID || "AZALEA",
      To: mobile,
      Msg: message,
    }).toString(),
  });

  const data = await res.json();
  if (data.Status !== "Success") {
    throw new Error(`2Factor SMS error: ${data.Details || JSON.stringify(data)}`);
  }
}

export async function sendOrderConfirmationSMS(
  phone: string,
  orderId: string
): Promise<void> {
  const shortId = orderId.slice(-8).toUpperCase();
  await sendTransactionalSMS(
    phone,
    `Azalea by Zehra: Your order #${shortId} has been placed! We will notify you when it ships. Track at azaleabyzehra.com/orders`
  );
}

export async function sendShipmentSMS(
  phone: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  const shortId = orderId.slice(-8).toUpperCase();
  await sendTransactionalSMS(
    phone,
    `Azalea by Zehra: Your order #${shortId} has shipped! Tracking ID: ${trackingId}. Track at azaleabyzehra.com/orders`
  );
}
