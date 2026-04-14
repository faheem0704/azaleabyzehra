import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "orders@azaleabyzehra.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Your Azalea by Zehra verification code",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 28px; color: #3D3D3D; margin-bottom: 8px;">Azalea by Zehra</h1>
        <p style="color: #6B6B6B; font-size: 15px; margin-bottom: 32px;">Your verification code</p>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #6B6B6B; font-size: 14px; margin-bottom: 16px;">Use this code to verify your account:</p>
          <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #C9956C; margin: 16px 0;">${otp}</div>
          <p style="color: #A8929E; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
        <p style="color: #A8929E; font-size: 12px; margin-top: 24px; text-align: center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  order: {
    id: string;
    items: { name: string; quantity: number; price: number; size: string; color: string }[];
    totalAmount: number;
    address: { name: string; line1: string; city: string; state: string; pincode: string };
  }
): Promise<void> {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F5EDE0; color: #3D3D3D;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F5EDE0; color: #6B6B6B; text-align: center;">${item.size} / ${item.color} × ${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F5EDE0; color: #3D3D3D; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()} | Azalea by Zehra`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 28px; color: #3D3D3D;">Azalea by Zehra</h1>
        <h2 style="font-size: 20px; color: #C9956C; margin-bottom: 4px;">Order Confirmed!</h2>
        <p style="color: #6B6B6B;">Order #${order.id.slice(-8).toUpperCase()}</p>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="text-align: left; color: #A8929E; font-size: 12px; padding-bottom: 12px;">Item</th>
                <th style="text-align: center; color: #A8929E; font-size: 12px; padding-bottom: 12px;">Details</th>
                <th style="text-align: right; color: #A8929E; font-size: 12px; padding-bottom: 12px;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align: right; margin-top: 16px;">
            <strong style="font-size: 18px; color: #C9956C;">Total: ₹${order.totalAmount.toLocaleString()}</strong>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 24px;">
          <h3 style="color: #3D3D3D; font-size: 14px; margin-bottom: 8px;">Delivering to:</h3>
          <p style="color: #6B6B6B; margin: 0;">${order.address.name}</p>
          <p style="color: #6B6B6B; margin: 4px 0;">${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}</p>
        </div>
        <p style="color: #A8929E; font-size: 13px; margin-top: 24px; text-align: center;">
          Track your order at <a href="${APP_URL}/orders" style="color: #C9956C;">${APP_URL}/orders</a>
        </p>
      </div>
    `,
  });
}

export async function sendLowStockAlert(
  adminEmail: string,
  info: { productName: string; size: string; color: string; remaining: number }
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Low Stock Alert: ${info.productName} (${info.size} / ${info.color})`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 24px; color: #3D3D3D;">Azalea by Zehra — Low Stock Alert</h1>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #6B6B6B; font-size: 15px; margin: 0 0 8px 0;"><strong>${info.productName}</strong></p>
          <p style="color: #6B6B6B; font-size: 14px; margin: 4px 0;">Size: ${info.size} &nbsp;·&nbsp; Color: ${info.color}</p>
          <p style="color: #C9956C; font-size: 22px; font-weight: 700; margin: 16px 0 0 0;">${info.remaining} unit${info.remaining === 1 ? "" : "s"} remaining</p>
        </div>
        <p style="color: #A8929E; font-size: 13px;">Log in to your admin panel to restock this variant.</p>
      </div>
    `,
  });
}

export async function sendShipmentEmail(
  email: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your order has shipped! 📦 | Azalea by Zehra`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 28px; color: #3D3D3D;">Azalea by Zehra</h1>
        <h2 style="font-size: 20px; color: #C9956C;">Your order is on its way!</h2>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0;">
          <p style="color: #6B6B6B;">Order #${orderId.slice(-8).toUpperCase()}</p>
          <p style="color: #6B6B6B; font-size: 14px;">Tracking ID:</p>
          <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #C9956C; margin: 12px 0;">${trackingId}</div>
        </div>
        <p style="color: #A8929E; font-size: 13px; text-align: center;">
          <a href="${APP_URL}/orders" style="color: #C9956C;">View your order status →</a>
        </p>
      </div>
    `,
  });
}
