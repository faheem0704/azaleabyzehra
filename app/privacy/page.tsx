import MainLayout from "@/components/layout/MainLayout";
import PolicyLayout from "@/components/policies/PolicyLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Azalea by Zehra",
  description: "Privacy Policy for Azalea by Zehra.",
};

export default function PrivacyPage() {
  return (
    <MainLayout>
      <PolicyLayout
        title="Privacy Policy"
        lastUpdated="April 2025"
        breadcrumb="Privacy Policy"
        sections={[
          {
            heading: "Introduction",
            content: (
              <p>
                Azalea by Zehra (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains what personal information we collect, how we use it, and your rights regarding that information when you use our website.
              </p>
            ),
          },
          {
            heading: "Information We Collect",
            content: (
              <>
                <p>We collect the following types of information:</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Account information: name, email address, phone number, and password (stored encrypted) when you register",
                    "Order information: delivery address, order history, payment status, and transaction IDs",
                    "Usage data: pages visited, products viewed, and browsing behaviour on the site",
                    "Communications: messages or queries you send us via WhatsApp, Instagram, or email",
                    "Newsletter subscriptions: your email address if you subscribe to our mailing list",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  We do <strong className="text-charcoal">not</strong> store your credit/debit card details — all payment processing is handled by Razorpay, which is PCI-DSS certified.
                </p>
              </>
            ),
          },
          {
            heading: "How We Use Your Information",
            content: (
              <ul className="space-y-2">
                {[
                  "To process and fulfil your orders and send confirmation and shipment notifications",
                  "To manage your account and provide customer support",
                  "To send promotional emails or offers — only if you have opted in",
                  "To improve our website, product offerings, and customer experience",
                  "To detect and prevent fraudulent transactions or policy violations",
                  "To comply with applicable legal obligations",
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
            heading: "Sharing Your Information",
            content: (
              <>
                <p>We do not sell, rent, or trade your personal information. We may share it with:</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Courier and logistics partners — to fulfil and track your delivery",
                    "Razorpay — to process your payment securely",
                    "Resend (email service) — to send order and shipment notifications",
                    "Legal authorities — if required to do so by law or court order",
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
            heading: "Cookies",
            content: (
              <p>
                We use cookies to maintain your session, remember your cart, and understand how visitors use the site through anonymised analytics. You can disable cookies in your browser settings, though some site features may not function correctly as a result.
              </p>
            ),
          },
          {
            heading: "Data Retention",
            content: (
              <p>
                We retain your account and order information for as long as your account is active or as required to fulfil our legal obligations (typically up to 3 years for order records). You may request deletion of your account and data at any time.
              </p>
            ),
          },
          {
            heading: "Data Security",
            content: (
              <p>
                We implement industry-standard security measures including encrypted passwords, HTTPS connections, and access controls. No method of transmission over the internet is 100% secure — while we strive to protect your information, we cannot guarantee absolute security.
              </p>
            ),
          },
          {
            heading: "Your Rights",
            content: (
              <>
                <p>You have the right to:</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Access the personal information we hold about you",
                    "Request correction of inaccurate data",
                    "Request deletion of your account and personal data",
                    "Opt out of marketing emails at any time via the unsubscribe link in any email we send",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-gold mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">To exercise any of these rights, contact us on WhatsApp or Instagram DM (@azalea_by_zehra).</p>
              </>
            ),
          },
          {
            heading: "Children's Privacy",
            content: (
              <p>
                Our website is not intended for children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us and we will delete it promptly.
              </p>
            ),
          },
          {
            heading: "Changes to This Policy",
            content: (
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. We encourage you to review this page periodically.
              </p>
            ),
          },
          {
            heading: "Contact",
            content: (
              <p>
                For any privacy-related queries, please contact us on WhatsApp, via Instagram DM (@azalea_by_zehra), or at the email address listed in the footer of this website.
              </p>
            ),
          },
        ]}
      />
    </MainLayout>
  );
}
