// SMS disabled — using email notifications only.
// These functions are no-ops so existing callers don't need to change.
// To enable SMS in the future, replace this file with an SMS provider integration.

export async function sendOTPSMS(_phone: string, _otp: string): Promise<void> {
  // no-op
}

export async function sendOrderConfirmationSMS(
  _phone: string,
  _orderId: string
): Promise<void> {
  // no-op
}

export async function sendShipmentSMS(
  _phone: string,
  _orderId: string,
  _trackingId: string
): Promise<void> {
  // no-op
}
