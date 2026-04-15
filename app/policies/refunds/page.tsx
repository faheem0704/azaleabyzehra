import PolicyLayout from "@/components/policies/PolicyLayout";

export const metadata = { title: "Refund Policy — Azalea by Zehra" };

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund Policy"
      lastUpdated="April 2025"
      breadcrumb="Refund Policy"
      sections={[
        {
          heading: "Overview",
          content: (
            <p>
              If your return request is approved (see our Return &amp; Exchange Policy), we will process a full refund to the bank account of your choice. This policy explains the refund process, timelines, and conditions.
            </p>
          ),
        },
        {
          heading: "Refund Eligibility",
          content: (
            <>
              <p>Refunds are issued in the following situations:</p>
              <ul className="mt-3 space-y-2">
                {[
                  "Approved return of a damaged or incorrect item",
                  "A requested size/colour exchange cannot be fulfilled due to stock unavailability",
                  "An order is cancelled before it has been shipped (while in Pending status)",
                  "We are unable to fulfil your order due to stock or logistics issues",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          ),
        },
        {
          heading: "How Refunds Are Processed",
          content: (
            <>
              <p>
                All refunds are transferred directly to a bank account of your choice — we do not refund to wallets, UPI IDs (unless agreed upon), or store credits.
              </p>
              <p className="mt-3">
                Once your return is received and inspected, or once the exchange/cancellation is confirmed, our team will contact you via WhatsApp or Instagram DM to collect your bank account details:
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  "Account holder name",
                  "Bank account number",
                  "IFSC code",
                  "Bank name and branch",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-mauve italic">
                Never share your bank account details through unsolicited messages. We will only request details through our verified WhatsApp or Instagram channels.
              </p>
            </>
          ),
        },
        {
          heading: "Refund Timeline",
          content: (
            <ul className="space-y-2">
              {[
                "Return quality inspection: 1–3 business days after we receive the item",
                "Refund initiation: within 2 business days of inspection approval",
                "Amount credited to your bank account: 3–7 business days depending on your bank",
                "Total estimated time: 6–12 business days from return delivery",
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
          heading: "Shipping Charges",
          content: (
            <p>
              Original shipping charges are non-refundable unless the return is due to our error (damaged item or wrong product sent). In cases of our error, we also cover the return shipping cost.
            </p>
          ),
        },
        {
          heading: "Order Cancellations",
          content: (
            <>
              <p>
                You may cancel your order at any time while it is in <em>Pending</em> status through your account&apos;s Orders page. Once an order moves to <em>Processing</em> or <em>Shipped</em>, it cannot be cancelled.
              </p>
              <p className="mt-3">
                Cancellation refunds are processed to your bank account within 5–7 business days.
              </p>
            </>
          ),
        },
        {
          heading: "Non-Refundable Situations",
          content: (
            <ul className="space-y-2">
              {[
                "Change of mind after the order has been shipped",
                "Size or colour not as expected when the correct item was delivered",
                "Orders placed during flash sales or with special discount codes (unless item is damaged)",
                "Items that fail the return quality check (worn, washed, or damaged after delivery)",
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
          heading: "Questions?",
          content: (
            <p>
              For any refund-related queries, please contact us on WhatsApp or Instagram DM with your order ID. We will respond within 1 business day.
            </p>
          ),
        },
      ]}
    />
  );
}
