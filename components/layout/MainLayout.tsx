import { prisma } from "@/lib/prisma";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CartSync from "@/components/layout/CartSync";
import SessionProvider from "@/components/providers/SessionProvider";
import AnnouncementBanner from "./AnnouncementBanner";
import SocialProofPopup from "@/components/products/SocialProofPopup";

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
}

async function getSalePageActive(): Promise<boolean> {
  try {
    const s = await prisma.settings.findFirst({ select: { salePageActive: true } });
    return s?.salePageActive ?? false;
  } catch {
    return false;
  }
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [categories, salePageActive] = await Promise.all([getCategories(), getSalePageActive()]);

  return (
    <SessionProvider>
      <CartSync />
      <AnnouncementBanner />
      <Header categories={categories} salePageActive={salePageActive} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <SocialProofPopup />
    </SessionProvider>
  );
}
