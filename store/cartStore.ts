import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartStore, AppliedPromo } from "@/types";

// After any cart mutation, check whether the applied promo still meets its minimum
// order requirement. Returns null (clears promo) if the new subtotal falls below it.
function revalidatePromo(
  items: CartItem[],
  promo: AppliedPromo | null
): AppliedPromo | null {
  if (!promo) return null;
  if (!promo.minOrderAmount) return promo; // no minimum — always valid
  const newSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return newSubtotal >= promo.minOrderAmount ? promo : null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedPromo: null,

      setPromo: (promo) => set({ appliedPromo: promo }),

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.size === item.size &&
            i.color === item.color
        );

        let newItems: CartItem[];
        if (existingIndex !== -1) {
          newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
            // Always sync to the latest price — prevents stale price doubling
            price: item.price,
          };
        } else {
          newItems = [
            ...items,
            { ...item, id: `${item.productId}-${item.size}-${item.color}-${Date.now()}` },
          ];
        }

        set({
          items: newItems,
          appliedPromo: revalidatePromo(newItems, get().appliedPromo),
        });
      },

      removeItem: (productId, size, color) => {
        const newItems = get().items.filter(
          (i) => !(i.productId === productId && i.size === size && i.color === color)
        );
        set({
          items: newItems,
          appliedPromo: revalidatePromo(newItems, get().appliedPromo),
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        const newItems = get().items.map((i) =>
          i.productId === productId && i.size === size && i.color === color
            ? { ...i, quantity }
            : i
        );
        set({
          items: newItems,
          appliedPromo: revalidatePromo(newItems, get().appliedPromo),
        });
      },

      setItems: (items) => set({ items }),
      clearCart: () => set({ items: [], appliedPromo: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "azalea-by-zehra-cart",
      partialize: (state) => ({ items: state.items, appliedPromo: state.appliedPromo }),
    }
  )
);
