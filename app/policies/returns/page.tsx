import PolicyLayout from "@/components/policies/PolicyLayout";

export const metadata = { title: "Return & Exchange Policy — Azalea by Zehra" };

export default function ReturnsPage() {
  return (
    <PolicyLayout
      title="Return & Exchange Policy"
      lastUpdated="April 2025"
      breadcrumb="Return & Exchange Policy"
      sections={[
        {
          heading: "Our Commitment",
          content: (
            <p>
              At Azalea by Zehra, every piece is quality-checked before it leaves us. However, if something is not right on our end, we are here to make it right. Please read this policy carefully before placing an order.
            </p>
          ),
        },
        {
          heading: "When Returns Are Accepted",
          content: (
            <>
              <p>We accept return requests <strong className="text-charcoal">only</strong> in the following cases:</p>
              <ul className="mt-3 space-y-2">
                {[
                  "You received a product that is physically damaged (torn, stained, or defective fabric)",
                  "You received a wrong item — wrong product, wrong size, or wrong colour compared to what you ordered",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-mauve italic">
                Returns are not accepted for reasons such as change of mind, incorrect size ordered, colour looking slightly different on screen vs. in person, or if the item has been worn, washed, or altered.
              </p>
            </>
          ),
        },
        {
          heading: "How to Raise a Return Request",
          content: (
            <>
              <p>To initiate a return, you must contact us <strong className="text-charcoal">within 48 hours of delivery</strong> through one of the following channels:</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-charcoal">WhatsApp</strong> — Send us a message with your order ID and clear photos/videos of the damage or wrong item
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-charcoal">Instagram DM</strong> — @azalea_by_zehra — include your order ID and photos
                  </span>
                </li>
              </ul>
              <p className="mt-4">Our team will review your request within 1–2 business days and guide you through the next steps. Do not ship the item back without receiving confirmation from us first.</p>
            </>
          ),
        },
        {
          heading: "Return Conditions",
          content: (
            <ul className="space-y-2">
              {[
                "Item must be unused, unwashed, and unaltered",
                "All original tags must be attached",
                "Original packaging must be intact",
                "Return request must be raised within 48 hours of delivery — requests raised after this window will not be entertained",
                "A clear unboxing video is strongly recommended as proof in case of damage claims",
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
          heading: "Size & Colour Exchange",
          content: (
            <>
              <p>
                We understand that finding the perfect fit matters. Size and colour exchange requests are accepted <strong className="text-charcoal">only before the order has been shipped</strong> — that is, while the order is in <em>Pending</em> or <em>Processing</em> status.
              </p>
              <p className="mt-3">
                Once your order has been dispatched, exchanges can no longer be processed as the item is already in transit. Please double-check our size guide before placing your order to ensure you select the correct size.
              </p>
              <p className="mt-3">
                To request a pre-shipment exchange, contact us on WhatsApp or Instagram DM with your order ID and the desired size or colour. Exchange is subject to stock availability. If the requested variant is unavailable, we will offer an alternative or process a full refund.
              </p>
            </>
          ),
        },
        {
          heading: "Items Not Eligible for Return or Exchange",
          content: (
            <ul className="space-y-2">
              {[
                "Items purchased during a sale or at a discounted price (unless damaged or incorrect)",
                "Dupattas and accessories",
                "Items that have been worn, washed, dry-cleaned, or altered",
                "Items without original tags or packaging",
                "Requests raised more than 48 hours after delivery",
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
          heading: "Need Help?",
          content: (
            <p>
              If you have any questions about this policy, reach out to us on WhatsApp or Instagram DM — we are always happy to help.
            </p>
          ),
        },
      ]}
    />
  );
}
