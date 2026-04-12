import twilio from "twilio";

// Lazy client — only created when env vars are present and a function is called.
// Avoids module-load-time crash when Twilio env vars aren't set.
function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
}

const FROM = () => {
  const num = process.env.TWILIO_PHONE_NUMBER;
  if (!num) throw new Error("TWILIO_PHONE_NUMBER not configured");
  return num;
};

export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  await getClient().messages.create({
    body: `Your Azalea by Zehra verification code is: ${otp}. Valid for 10 minutes.`,
    from: FROM(),
    to: phone,
  });
}

export async function sendOrderConfirmationSMS(
  phone: string,
  orderId: string
): Promise<void> {
  await getClient().messages.create({
    body: `Azalea by Zehra: Your order #${orderId.slice(-8).toUpperCase()} has been placed! We'll notify you when it ships. Track at azaleabyzehra.com/orders`,
    from: FROM(),
    to: phone,
  });
}

export async function sendShipmentSMS(
  phone: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  await getClient().messages.create({
    body: `Azalea by Zehra: Your order #${orderId.slice(-8).toUpperCase()} has shipped! Tracking ID: ${trackingId}. Track at azaleabyzehra.com/orders`,
    from: FROM(),
    to: phone,
  });
}
