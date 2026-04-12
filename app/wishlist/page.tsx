export const dynamic = "force-dynamic";

import MainLayout from "@/components/layout/MainLayout";
import WishlistPageClient from "@/components/wishlist/WishlistPageClient";

export const metadata = {
  title: "My Wishlist",
  description: "Your saved items on Azalea by Zehra.",
};

export default function WishlistPage() {
  return (
    <MainLayout>
      <WishlistPageClient />
    </MainLayout>
  );
}
