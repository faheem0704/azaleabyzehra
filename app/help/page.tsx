import MainLayout from "@/components/layout/MainLayout";
import HelpPageClient from "@/components/help/HelpPageClient";

export const metadata = {
  title: "Help & FAQ",
  description: "Shipping, returns, sizing, and payment info for Azalea by Zehra.",
};

export default function HelpPage() {
  return (
    <MainLayout>
      <HelpPageClient />
    </MainLayout>
  );
}
