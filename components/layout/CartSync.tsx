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

  // BUG-13: reset sync flag when the user signs out so the next sign-in
  // (same browser tab, different account) triggers a fresh sync.
  useEffect(() => {
    if (status === "unauthenticated") {
      synced.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || synced.current) return;
    synced.current = true;

    const syncAll = async () => {
      try {
        // ── Cart ────────────────────────────────────────────────────────────
        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const { items: serverItems } = await cartRes.json();

          // Merge: start with local items, append server-only items
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
                // BUG-17: use the stored price if available, fall back to product.price
                price: si.price > 0 ? si.price : si.product.price,
              });
            }
          }

          // BUG-16: validate all productIds in the merged cart against the
          // server to strip out soft-deleted products that may linger in
          // localStorage from a previous session.
          const allIds = Array.from(new Set(merged.map((i) => i.productId)));
          let validIdArray: string[] = allIds; // default: trust all
          if (allIds.length > 0) {
            const batchRes = await fetch(`/api/products/batch?ids=${allIds.join(",")}`).catch(() => null);
            if (batchRes?.ok) {
              const validProducts = (await batchRes.json()) as { id: string }[];
              validIdArray = validProducts.map((p) => p.id);
            }
          }
          const validIdSet = new Set(validIdArray);
          const cleaned = merged.filter((i) => validIdSet.has(i.productId));

          setCartItems(cleaned);

          // Push cleaned state back to server
          await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cleaned.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                size: i.size,
                color: i.color,
                price: i.price,
              })),
            }),
          });
        }

        // ── Wishlist ────────────────────────────────────────────────────────
        const wishRes = await fetch("/api/wishlist");
        if (wishRes.ok) {
          const { products: serverProducts } = await wishRes.json();

          // BUG-16: wishlist GET returns products already filtered by
          // isDeleted: false, so use the products array (not productIds)
          // as the source of truth for valid server wishlist entries.
          const validServerIds = (serverProducts ?? []).map((p: { id: string }) => p.id);

          const localIds = localWishItems.map((i) => i.productId);
          const mergedIds = Array.from(new Set([...localIds, ...validServerIds]));

          // BUG-16: validate local-only wishlist items against the batch API
          const localOnlyIds = mergedIds.filter((id) => !validServerIds.includes(id));
          let validLocalIds: Set<string> = new Set(localOnlyIds);
          if (localOnlyIds.length > 0) {
            const batchRes = await fetch(`/api/products/batch?ids=${localOnlyIds.join(",")}`).catch(() => null);
            if (batchRes?.ok) {
              const valid = (await batchRes.json()) as { id: string }[];
              validLocalIds = new Set(valid.map((p) => p.id));
            }
          }

          const cleanedIds = mergedIds.filter(
            (id) => validServerIds.includes(id) || validLocalIds.has(id)
          );

          const productMap = new Map(
            (serverProducts ?? []).map((p: WishlistItem["product"]) => [p!.id, p])
          );
          const mergedItems: WishlistItem[] = cleanedIds.map((id) => {
            const existing = localWishItems.find((i) => i.productId === id);
            if (existing) return existing;
            const serverProduct = productMap.get(id) as WishlistItem["product"];
            return { productId: id, product: serverProduct, addedAt: new Date() };
          });

          setWishlistItems(mergedItems);

          await fetch("/api/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: cleanedIds }),
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
            price: i.price, // BUG-17: persist price
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
