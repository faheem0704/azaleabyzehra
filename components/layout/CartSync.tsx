"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { CartItem, WishlistItem } from "@/types";

/**
 * CartSync: runs once on sign-in to merge local (localStorage) state with server DB.
 * Strategy: local items take precedence on quantity; server items not in local are appended.
 * After merge, pushes the merged state back to the server.
 */
export default function CartSync() {
  const { data: session, status } = useSession();
  const { items: localCartItems, setItems: setCartItems } = useCartStore();
  const { items: localWishItems, setItems: setWishlistItems } = useWishlistStore();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || synced.current) return;
    synced.current = true;

    const syncAll = async () => {
      try {
        // --- Cart ---
        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const { items: serverItems } = await cartRes.json();

          // Merge: start with local items, append server items not already present
          const merged: CartItem[] = [...localCartItems];
          for (const si of serverItems) {
            const exists = merged.find(
              (m) => m.productId === si.productId && m.size === si.size && m.color === si.color
            );
            if (!exists && si.product) {
              merged.push({
                id: `${si.productId}-${si.size}-${si.color}-${Date.now()}`,
                productId: si.productId,
                product: si.product,
                quantity: si.quantity,
                size: si.size,
                color: si.color,
                price: si.product.price,
              });
            }
          }

          setCartItems(merged);

          // Push merged state back to server
          await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: merged.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                size: i.size,
                color: i.color,
                price: i.price,
              })),
            }),
          });
        }

        // --- Wishlist ---
        const wishRes = await fetch("/api/wishlist");
        if (wishRes.ok) {
          const { productIds: serverIds, products: serverProducts } = await wishRes.json();

          // Merge: combine local + server product IDs (dedup)
          const localIds = localWishItems.map((i) => i.productId);
          const mergedIds = Array.from(new Set([...localIds, ...(serverIds ?? [])]));

          // Build merged wishlist items
          const productMap = new Map(
            (serverProducts ?? []).map((p: any) => [p.id, p])
          );
          const mergedItems: WishlistItem[] = mergedIds.map((id) => {
            const existing = localWishItems.find((i) => i.productId === id);
            if (existing) return existing;
            const serverProduct = productMap.get(id) as WishlistItem["product"];
            return { productId: id, product: serverProduct, addedAt: new Date() };
          });

          setWishlistItems(mergedItems);

          // Push merged IDs back to server
          await fetch("/api/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: mergedIds }),
          });
        }
      } catch {
        // Sync is best-effort; silent fail
      }
    };

    syncAll();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push cart to server whenever it changes (debounced), after initial sync
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !synced.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: localCartItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            price: i.price,
          })),
        }),
      }).catch(() => {});
    }, 1500);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [localCartItems, status]);

  // Push wishlist to server whenever it changes
  const wishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !synced.current) return;

    if (wishTimerRef.current) clearTimeout(wishTimerRef.current);
    wishTimerRef.current = setTimeout(() => {
      fetch("/api/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: localWishItems.map((i) => i.productId) }),
      }).catch(() => {});
    }, 1500);

    return () => {
      if (wishTimerRef.current) clearTimeout(wishTimerRef.current);
    };
  }, [localWishItems, status]);

  return null;
}
