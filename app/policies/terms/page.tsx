import PolicyLayout from "@/components/policies/PolicyLayout";

export const metadata = { title: "Terms of Service — Azalea by Zehra" };

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      lastUpdated="April 2025"
      breadcrumb="Terms of Service"
      sections={[
        {
          heading: "Agreement to Terms",
          content: (
            <p>
              By accessing or using the Azalea by Zehra website (<em>azaleabyzehra.vercel.app</em>) or placing an order with us, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
            </p>
          ),
        },
        {
          heading: "Eligibility",
          content: (
            <p>
              You must be at least 18 years old to use this website and place an order. By using the site, you confirm that you meet this age requirement. If you are under 18, you may only use the site under the supervision of a parent or legal guardian.
            </p>
          ),
        },
        {
          heading: "Account Responsibility",
          content: (
            <>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Please notify us immediately if you suspect any unauthorised access.
              </p>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that we believe are being used fraudulently or in violation of these terms.
              </p>
            </>
          ),
        },
        {
          heading: "Products & Pricing",
          content: (
            <>
              <p>
                We make every effort to display product colours, fabrics, and dimensions as accurately as possible. However, slight variations in colour may occur due to screen calibration differences and the nature of handcrafted textiles — these are not considered defects.
              </p>
              <p className="mt-3">
                All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes. Shipping charges are calculated and displayed separately at checkout. We reserve the right to change prices at any time without prior notice, but prices confirmed at the time of order placement will be honoured.
              </p>
            </>
          ),
        },
        {
          heading: "Order Acceptance",
          content: (
            <>
              <p>
                Placing an order constitutes an offer to purchase. An order is confirmed only once you receive an order confirmation email from us. We reserve the right to cancel or refuse any order at our discretion — for example, in cases of pricing errors, suspected fraud, or stock unavailability.
              </p>
              <p className="mt-3">
                In the event of cancellation after payment, a full refund will be issued to your bank account.
              </p>
            </>
          ),
        },
        {
          heading: "Payments",
          content: (
            <p>
              All payments are processed securely through Razorpay, a PCI-DSS compliant payment gateway. We do not store your card or payment details on our servers. By placing an order, you authorise us to charge the total amount displayed at checkout.
            </p>
          ),
        },
        {
          heading: "Intellectual Property",
          content: (
            <p>
              All content on this website — including product images, text, logos, and design — is the intellectual property of Azalea by Zehra. You may not reproduce, distribute, or use any content for commercial purposes without our written permission. Sharing our products on social media with appropriate credit is welcomed and appreciated.
            </p>
          ),
        },
        {
          heading: "Prohibited Use",
          content: (
            <>
              <p>You agree not to:</p>
              <ul className="mt-3 space-y-2">
                {[
                  "Use the site for any unlawful purpose or in violation of any regulations",
                  "Attempt to gain unauthorised access to any part of the site or its systems",
                  "Submit false, misleading, or fraudulent orders or information",
                  "Use automated tools or bots to scrape, crawl, or interact with the site",
                  "Post or transmit harmful, offensive, or abusive content through reviews or any other channel",
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
          heading: "Limitation of Liability",
          content: (
            <p>
              Azalea by Zehra shall not be liable for any indirect, incidental, or consequential damages arising from your use of the website or products. Our maximum liability to you for any claim shall not exceed the amount paid for the specific order in question.
            </p>
          ),
        },
        {
          heading: "Governing Law",
          content: (
            <p>
              These terms are governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of the website shall be subject to the exclusive jurisdiction of the courts of Kerala, India.
            </p>
          ),
        },
        {
          heading: "Changes to Terms",
          content: (
            <p>
              We may update these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the site following any changes constitutes your acceptance of the revised terms.
            </p>
          ),
        },
        {
          heading: "Contact Us",
          content: (
            <p>
              For questions about these Terms of Service, reach out to us on WhatsApp or Instagram DM (@azalea_by_zehra), or email us at the address listed in the footer.
            </p>
          ),
        },
      ]}
    />
  );
}
