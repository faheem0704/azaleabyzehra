import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "orders@azaleabyzehra.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

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
          <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #C9956C; margin: 16px 0;">${escHtml(otp)}</div>
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
        <td style="padding: 12px 0; border-bottom: 1px solid #F5EDE0; color: #3D3D3D;">${escHtml(item.name)}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F5EDE0; color: #6B6B6B; text-align: center;">${escHtml(item.size)} / ${escHtml(item.color)} × ${item.quantity}</td>
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
          <p style="color: #6B6B6B; margin: 0;">${escHtml(order.address.name)}</p>
          <p style="color: #6B6B6B; margin: 4px 0;">${escHtml(order.address.line1)}, ${escHtml(order.address.city)}, ${escHtml(order.address.state)} ${escHtml(order.address.pincode)}</p>
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
          <p style="color: #6B6B6B; font-size: 15px; margin: 0 0 8px 0;"><strong>${escHtml(info.productName)}</strong></p>
          <p style="color: #6B6B6B; font-size: 14px; margin: 4px 0;">Size: ${escHtml(info.size)} &nbsp;·&nbsp; Color: ${escHtml(info.color)}</p>
          <p style="color: #C9956C; font-size: 22px; font-weight: 700; margin: 16px 0 0 0;">${info.remaining} unit${info.remaining === 1 ? "" : "s"} remaining</p>
        </div>
        <p style="color: #A8929E; font-size: 13px;">Log in to your admin panel to restock this variant.</p>
      </div>
    `,
  });
}

export async function sendNewOrderAlert(
  adminEmail: string,
  order: {
    id: string;
    customerName: string;
    customerContact: string;
    totalAmount: number;
    itemCount: number;
  }
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Order #${order.id.slice(-8).toUpperCase()} — ₹${order.totalAmount.toLocaleString()} | Azalea by Zehra`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 24px; color: #3D3D3D;">Azalea by Zehra — New Order</h1>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #A8929E; font-size: 13px; margin: 0 0 4px 0;">Order ID</p>
          <p style="color: #3D3D3D; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">#${order.id.slice(-8).toUpperCase()}</p>
          <p style="color: #A8929E; font-size: 13px; margin: 0 0 4px 0;">Customer</p>
          <p style="color: #3D3D3D; font-size: 15px; margin: 0 0 16px 0;">${escHtml(order.customerName)} · ${escHtml(order.customerContact)}</p>
          <p style="color: #A8929E; font-size: 13px; margin: 0 0 4px 0;">Items</p>
          <p style="color: #3D3D3D; font-size: 15px; margin: 0 0 16px 0;">${order.itemCount} item${order.itemCount === 1 ? "" : "s"}</p>
          <p style="color: #A8929E; font-size: 13px; margin: 0 0 4px 0;">Total</p>
          <p style="color: #C9956C; font-size: 24px; font-weight: 700; margin: 0;">₹${order.totalAmount.toLocaleString()}</p>
        </div>
        <a href="${APP_URL}/admin/orders" style="display: inline-block; background: #C9956C; color: #fff; padding: 12px 24px; font-size: 14px; text-decoration: none; border-radius: 4px;">View in Admin Panel →</a>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  const safeName = escHtml(name.trim());
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to Azalea by Zehra`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 28px; color: #3D3D3D; margin-bottom: 8px;">Azalea by Zehra</h1>
        <p style="color: #6B6B6B; font-size: 15px; margin-bottom: 32px;">Welcome to our store</p>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 32px;">
          <p style="color: #3D3D3D; font-size: 16px; margin: 0 0 12px 0;">Hello, ${safeName}!</p>
          <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 24px 0;">
            We're so glad you're here. Explore our latest kurtis, anarkalis, co-ords, and more — handpicked for you.
          </p>
          <a href="${APP_URL}/products" style="display: inline-block; background: #C9956C; color: #fff; padding: 12px 28px; font-size: 14px; text-decoration: none; border-radius: 4px;">Shop Now →</a>
        </div>
        <p style="color: #A8929E; font-size: 12px; margin-top: 24px; text-align: center;">
          You're receiving this because you created an account with us.
        </p>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(
  email: string,
  orderId: string,
  items: { name: string }[]
): Promise<void> {
  const itemsHtml = items
    .map((item) => `<li style="color: #3D3D3D; font-size: 14px; padding: 4px 0;">${escHtml(item.name)}</li>`)
    .join("");

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `How was your order? Leave a review | Azalea by Zehra`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF6EE;">
        <h1 style="font-size: 28px; color: #3D3D3D; margin-bottom: 8px;">Azalea by Zehra</h1>
        <p style="color: #6B6B6B; font-size: 15px; margin-bottom: 32px;">We'd love your feedback</p>
        <div style="background: #fff; border: 1px solid #F5EDE0; border-radius: 12px; padding: 32px;">
          <p style="color: #3D3D3D; font-size: 15px; margin: 0 0 16px 0;">Your order #${orderId.slice(-8).toUpperCase()} has been delivered!</p>
          <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 12px 0;">You purchased:</p>
          <ul style="margin: 0 0 24px 0; padding-left: 20px;">${itemsHtml}</ul>
          <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 24px 0;">We'd love to hear what you think. Your review helps other shoppers discover pieces they'll love.</p>
          <a href="${APP_URL}/orders" style="display: inline-block; background: #C9956C; color: #fff; padding: 12px 28px; font-size: 14px; text-decoration: none; border-radius: 4px;">Leave a Review →</a>
        </div>
        <p style="color: #A8929E; font-size: 12px; margin-top: 24px; text-align: center;">
          Thank you for shopping with Azalea by Zehra.
        </p>
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
          <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #C9956C; margin: 12px 0;">${escHtml(trackingId)}</div>
        </div>
        <p style="color: #A8929E; font-size: 13px; text-align: center;">
          <a href="${APP_URL}/orders" style="color: #C9956C;">View your order status →</a>
        </p>
      </div>
    `,
  });
}
