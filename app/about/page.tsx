import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import AboutPageClient from "@/components/about/AboutPageClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind Azalea by Zehra — India's premium destination for women's ethnic wear, crafted with love.",
};

export default function AboutPage() {
  return (
    <MainLayout>
      <AboutPageClient />
    </MainLayout>
  );
}
