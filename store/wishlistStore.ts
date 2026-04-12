import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WishlistItem, WishlistStore, Product } from "@/types";

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId: string, product?: Product) => {
        if (!get().hasItem(productId)) {
          set({
            items: [
              ...get().items,
              { productId, product, addedAt: new Date() },
            ],
          });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      hasItem: (productId: string) =>
        get().items.some((i) => i.productId === productId),

      totalItems: () => get().items.length,
    }),
    {
      name: "azalea-by-zehra-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
