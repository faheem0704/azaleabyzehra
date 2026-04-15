import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartStore, AppliedPromo } from "@/types";

// After any cart mutation, fully recalculate the promo discount against the
// current cart contents. This keeps discountAmount accurate as items are
// added, removed, or have their quantity/price changed.
// Returns null if the promo is no longer valid (minimum not met, or no
// eligible items remain for a product-specific promo).
function revalidatePromo(
  items: CartItem[],
  promo: AppliedPromo | null
): AppliedPromo | null {
  if (!promo) return null;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Clear if subtotal drops below the promo's minimum order amount
  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) return null;

  // Determine the eligible subtotal:
  // - empty productIds → applies to entire cart
  // - non-empty productIds → only the matching products count
  let eligibleSubtotal = subtotal;
  if (promo.productIds && promo.productIds.length > 0) {
    eligibleSubtotal = items
      .filter((i) => promo.productIds.includes(i.productId))
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    // If none of the eligible products remain in the cart, clear the promo
    if (eligibleSubtotal === 0) return null;
  }

  // Recalculate discount from scratch with the current eligible subtotal
  const rawDiscount = (eligibleSubtotal * promo.discountPercent) / 100;
  const discountAmount = Math.round(
    promo.maxDiscount ? Math.min(rawDiscount, promo.maxDiscount) : rawDiscount
  );

  return { ...promo, discountAmount };
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

      // setItems also revalidates the promo — covers the price-refresh path
      // where CartDrawer or CheckoutPage update prices after an admin change.
      setItems: (items) => set({
        items,
        appliedPromo: revalidatePromo(items, get().appliedPromo),
      }),
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
