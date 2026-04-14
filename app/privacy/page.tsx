import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Azalea by Zehra.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    content: `When you create an account or place an order, we collect your name, email address, phone number, and delivery address. We also collect payment information, though we never store card details directly — all payments are processed securely by Razorpay.\n\nWe automatically collect certain usage data such as pages visited, browser type, and device information to improve your experience.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to:\n• Process and fulfil your orders\n• Send order confirmations and shipping updates via email and SMS\n• Respond to your customer service requests\n• Send you promotional offers (only if you opt in)\n• Improve our website and services`,
  },
  {
    title: "Sharing Your Information",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your data with trusted service providers who assist us in operating our website (such as payment processors, delivery partners, and email services), under strict confidentiality agreements.\n\nWe may disclose information when required by law or to protect our rights.`,
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures to protect your personal information. All data transmission is encrypted using SSL/TLS. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "Cookies",
    content: `We use cookies to maintain your session, remember your cart, and analyse site traffic. You can disable cookies in your browser settings, but some features of the site may not function correctly as a result.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your account and associated data\n• Opt out of marketing communications at any time\n\nTo exercise any of these rights, contact us at hello@azaleabyzehra.com.`,
  },
  {
    title: "Children's Privacy",
    content: `Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website. Your continued use of our services after changes are posted constitutes your acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="pt-32 pb-24 section-padding">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-4">Legal</p>
            <h1 className="font-playfair text-5xl text-charcoal mb-4">Privacy Policy</h1>
            <p className="font-inter text-sm text-charcoal-light">Last updated: January 2025</p>
          </div>

          <p className="font-inter text-sm text-charcoal-light leading-relaxed mb-12">
            At Azalea by Zehra (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website or make a purchase.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <div key={i} className="border-t border-ivory-200 pt-8">
                <h2 className="font-playfair text-2xl text-charcoal mb-4">{section.title}</h2>
                <div className="font-inter text-sm text-charcoal-light leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 border-t border-ivory-200 pt-10">
            <h2 className="font-playfair text-2xl text-charcoal mb-4">Contact Us</h2>
            <p className="font-inter text-sm text-charcoal-light leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 space-y-2 font-inter text-sm text-charcoal-light">
              <p>Email: <a href="mailto:hello@azaleabyzehra.com" className="text-rose-gold hover:underline">hello@azaleabyzehra.com</a></p>
              <p>
                Or visit our{" "}
                <Link href="/help" className="text-rose-gold hover:underline">Help &amp; FAQ page</Link>
                {" "}to reach us directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
