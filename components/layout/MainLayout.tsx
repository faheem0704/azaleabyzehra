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

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <SessionProvider>
      <CartSync />
      <AnnouncementBanner />
      <Header categories={categories} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <SocialProofPopup />
    </SessionProvider>
  );
}
