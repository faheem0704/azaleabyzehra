// SMS delivery via MSG91 (Indian SMS gateway — better delivery + cheaper than Twilio for India)
// File kept as twilio.ts so existing imports don't need to change.
// API docs: https://docs.msg91.com/reference/send-transactional-sms

const MSG91_API = "https://api.msg91.com/api/v5/flow/";

function getAuthKey(): string {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) throw new Error("MSG91_AUTH_KEY not configured");
  return key;
}

// MSG91 expects: 919876543210 (country code + number, no + or spaces)
function formatMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits; // already has country code
  if (digits.length === 10) return `91${digits}`; // Indian number without country code
  return digits; // international — pass through
}

async function sendTemplate(
  templateId: string,
  mobile: string,
  variables: Record<string, string>
): Promise<void> {
  const res = await fetch(MSG91_API, {
    method: "POST",
    headers: {
      authkey: getAuthKey(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [{ mobiles: formatMobile(mobile), ...variables }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MSG91 error ${res.status}: ${text}`);
  }
}

// Template (register in MSG91 dashboard):
// "Your Azalea by Zehra verification code is: ##otp##. Valid for 10 minutes."
// Variable name: otp
export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!templateId) throw new Error("MSG91_OTP_TEMPLATE_ID not configured");
  await sendTemplate(templateId, phone, { otp });
}

// Template (register in MSG91 dashboard):
// "Azalea by Zehra: Your order ##order_id## has been placed! We will notify you when it ships. Track at azaleabyzehra.com/orders"
// Variable name: order_id
export async function sendOrderConfirmationSMS(
  phone: string,
  orderId: string
): Promise<void> {
  const templateId = process.env.MSG91_ORDER_TEMPLATE_ID;
  if (!templateId) throw new Error("MSG91_ORDER_TEMPLATE_ID not configured");
  await sendTemplate(templateId, phone, { order_id: orderId.slice(-8).toUpperCase() });
}

// Template (register in MSG91 dashboard):
// "Azalea by Zehra: Your order ##order_id## has shipped! Tracking ID: ##tracking_id##. Track at azaleabyzehra.com/orders"
// Variable names: order_id, tracking_id
export async function sendShipmentSMS(
  phone: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  const templateId = process.env.MSG91_SHIPMENT_TEMPLATE_ID;
  if (!templateId) throw new Error("MSG91_SHIPMENT_TEMPLATE_ID not configured");
  await sendTemplate(templateId, phone, {
    order_id: orderId.slice(-8).toUpperCase(),
    tracking_id: trackingId,
  });
}
