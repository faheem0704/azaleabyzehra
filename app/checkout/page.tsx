export const dynamic = "force-dynamic";

import MainLayout from "@/components/layout/MainLayout";
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

export const metadata = {
  title: "Checkout",
  description: "Complete your purchase at Azalea by Zehra.",
};

export default function CheckoutPage() {
  return (
    <MainLayout>
      <CheckoutPageClient />
    </MainLayout>
  );
}
