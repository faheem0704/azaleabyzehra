export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import InvoicePrintButtons from "@/components/admin/InvoicePrintButtons";

interface Props {
  params: { id: string };
}

export default async function InvoicePage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const settings = await prisma.settings.findFirst();
  const storeName = settings?.storeName ?? "Azalea by Zehra";
  const storeAddress = settings?.address ?? "";
  const storePhone = settings?.phone ?? "";
  const storeEmail = settings?.contactEmail ?? "";

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.totalAmount - subtotal + (order.discountAmount ?? 0);

  return (
    <>
      {/* Print button — client component (onClick cannot live in a server component) */}
      <InvoicePrintButtons />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto font-inter text-charcoal">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-charcoal">
          <div>
            <h1 className="font-playfair text-3xl text-charcoal">{storeName}</h1>
            <p className="text-sm text-mauve mt-1">{storeAddress}</p>
            <p className="text-sm text-mauve">{storePhone} · {storeEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest uppercase text-mauve mb-1">Invoice</p>
            <p className="font-playfair text-2xl text-charcoal">#{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-mauve mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Bill To + Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs tracking-widest uppercase text-mauve mb-3">Bill To</p>
            <p className="font-medium text-charcoal">{order.address.name}</p>
            <p className="text-sm text-charcoal-light mt-1">{order.address.phone}</p>
            <p className="text-sm text-charcoal-light">{order.address.line1}</p>
            {order.address.line2 && <p className="text-sm text-charcoal-light">{order.address.line2}</p>}
            <p className="text-sm text-charcoal-light">
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
            {order.user?.email && <p className="text-sm text-charcoal-light mt-1">{order.user.email}</p>}
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-mauve mb-3">Order Details</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-mauve">Status</span>
                <span className="font-medium">{order.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mauve">Payment</span>
                <span className="font-medium">{order.paymentStatus} {order.paymentGateway ? `· ${order.paymentGateway}` : ""}</span>
              </div>
              {order.trackingId && (
                <div className="flex justify-between text-sm">
                  <span className="text-mauve">Tracking</span>
                  <span className="font-medium">{order.trackingId}</span>
                </div>
              )}
              {order.promoCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-mauve">Promo</span>
                  <span className="font-medium">{order.promoCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-ivory-200">
              <th className="text-left pb-3 text-xs tracking-widest uppercase text-mauve font-normal">Item</th>
              <th className="text-center pb-3 text-xs tracking-widest uppercase text-mauve font-normal">Variant</th>
              <th className="text-center pb-3 text-xs tracking-widest uppercase text-mauve font-normal">Qty</th>
              <th className="text-right pb-3 text-xs tracking-widest uppercase text-mauve font-normal">Unit Price</th>
              <th className="text-right pb-3 text-xs tracking-widest uppercase text-mauve font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-ivory-200">
                <td className="py-4 text-sm text-charcoal pr-4">{item.product.name}</td>
                <td className="py-4 text-sm text-mauve text-center">{item.size} / {item.color}</td>
                <td className="py-4 text-sm text-charcoal text-center">{item.quantity}</td>
                <td className="py-4 text-sm text-charcoal text-right">{formatPrice(item.price)}</td>
                <td className="py-4 text-sm text-charcoal text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-mauve">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-rose-gold">
                <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                <span>− {formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-mauve">Shipping</span>
              <span>{shipping <= 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-playfair text-xl text-charcoal border-t border-charcoal pt-3 mt-3">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-ivory-200 text-center">
          <p className="font-playfair text-lg text-charcoal mb-1">{storeName}</p>
          <p className="text-xs text-mauve">Thank you for your order · No returns or exchanges once order is placed</p>
          <p className="text-xs text-mauve mt-1">
            For special requests, contact us on WhatsApp: {settings?.whatsappNumber ?? ""}
          </p>
        </div>
      </div>
    </>
  );
}
