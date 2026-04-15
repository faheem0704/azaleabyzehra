import PolicyLayout from "@/components/policies/PolicyLayout";

export const metadata = { title: "Shipping & Delivery Policy — Azalea by Zehra" };

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      lastUpdated="April 2025"
      breadcrumb="Shipping & Delivery Policy"
      sections={[
        {
          heading: "Overview",
          content: (
            <p>
              We ship all across India. Orders are carefully packed and handed to our courier partners within 1–2 business days of payment confirmation. Delivery timelines vary by location.
            </p>
          ),
        },
        {
          heading: "Delivery Timelines",
          content: (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ivory-200">
                    <th className="text-left py-3 pr-6 text-charcoal font-medium text-xs tracking-widest uppercase">Region</th>
                    <th className="text-left py-3 pr-6 text-charcoal font-medium text-xs tracking-widest uppercase">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {[
                    { region: "Inside Kerala", days: "5–10 business days" },
                    { region: "Outside Kerala (rest of India)", days: "7–14 business days" },
                    { region: "Remote / Hilly Areas", days: "Up to 18 business days" },
                  ].map((row) => (
                    <tr key={row.region}>
                      <td className="py-3 pr-6 text-charcoal">{row.region}</td>
                      <td className="py-3 text-charcoal-light">{row.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-mauve italic text-xs">
                Timelines are estimates from dispatch date and may be affected by public holidays, regional disruptions, or high-demand periods.
              </p>
            </div>
          ),
        },
        {
          heading: "Shipping Charges",
          content: (
            <>
              <p>
                A flat shipping fee is applied at checkout. Orders above a certain value qualify for <strong className="text-charcoal">free shipping</strong> — the applicable threshold is displayed during checkout and may be updated from time to time.
              </p>
              <p className="mt-3">
                For return shipments where the error is on our side (damaged or wrong item), we cover the return shipping cost in full.
              </p>
            </>
          ),
        },
        {
          heading: "Order Processing",
          content: (
            <ul className="space-y-2">
              {[
                "Orders placed on weekdays before 2 PM IST are typically processed the same day",
                "Orders placed on weekends or public holidays are processed on the next business day",
                "You will receive an order confirmation email immediately after placing your order",
                "A shipment notification email with tracking details is sent once your order is dispatched",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ),
        },
        {
          heading: "Shipment Tracking",
          content: (
            <>
              <p>
                Once your order is dispatched, you can track it in two ways:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-charcoal">Website — My Orders:</strong> Log in to your account and visit the Orders page. Your tracking ID and current shipment status will be visible on your order detail.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-charcoal">Email:</strong> A shipment email is sent to your registered email address with the tracking ID and a direct link to track your parcel on the courier's website.
                  </span>
                </li>
              </ul>
              <p className="mt-3">
                Tracking information may take up to 24 hours to become active after dispatch.
              </p>
            </>
          ),
        },
        {
          heading: "Delivery Attempts",
          content: (
            <>
              <p>
                Our courier partners will attempt delivery up to 3 times. If delivery fails on all attempts (e.g. incorrect address or recipient unavailable), the parcel is returned to us.
              </p>
              <p className="mt-3">
                In case of a returned parcel due to non-delivery, we will contact you to either re-ship the order (re-shipping charges applicable) or process a refund minus the original shipping fee.
              </p>
            </>
          ),
        },
        {
          heading: "Incorrect or Incomplete Address",
          content: (
            <p>
              Please ensure your delivery address and pincode are accurate before placing an order. Azalea by Zehra is not responsible for delays or failed deliveries caused by an incorrect or incomplete address provided at checkout.
            </p>
          ),
        },
        {
          heading: "Damaged Parcel on Delivery",
          content: (
            <p>
              If your parcel arrives visibly damaged, please photograph the sealed parcel before opening it and contact us immediately on WhatsApp or Instagram DM. Do not discard the packaging — it may be required for a courier claim.
            </p>
          ),
        },
      ]}
    />
  );
}
