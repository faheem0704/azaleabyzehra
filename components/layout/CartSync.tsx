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
        // ── Fetch cart + wishlist in parallel ───────────────────────────────
        const [cartRes, wishRes] = await Promise.all([
          fetch("/api/cart"),
          fetch("/api/wishlist"),
        ]);

        // Collect all product IDs from both for a single batch validation call
        let cartServerItems: any[] = [];
        let wishServerProducts: any[] = [];

        if (cartRes.ok) {
          const { items } = await cartRes.json();
          cartServerItems = items ?? [];
        }
        if (wishRes.ok) {
          const { products } = await wishRes.json();
          wishServerProducts = products ?? [];
        }

        // ── Merge cart ──────────────────────────────────────────────────────
        const mergedCart: CartItem[] = [...localCartItems];
        for (const si of cartServerItems) {
          const exists = mergedCart.find(
            (m) => m.productId === si.productId && m.size === si.size && m.color === si.color
          );
          if (!exists && si.product) {
            mergedCart.push({
              id: `${si.productId}-${si.size}-${si.color}-${Date.now()}`,
              productId: si.productId,
              product: si.product,
              quantity: si.quantity,
              size: si.size,
              color: si.color,
              price: si.price > 0 ? si.price : si.product.price,
            });
          }
        }

        // ── Merge wishlist ──────────────────────────────────────────────────
        const validServerWishIds = wishServerProducts.map((p: { id: string }) => p.id);
        const localWishIds = localWishItems.map((i) => i.productId);
        const mergedWishIds = Array.from(new Set([...localWishIds, ...validServerWishIds]));
        const localOnlyWishIds = mergedWishIds.filter((id) => !validServerWishIds.includes(id));

        // ── Batch validate all product IDs from both cart + wishlist at once ─
        const allCartIds = Array.from(new Set(mergedCart.map((i) => i.productId)));
        const batchIds = Array.from(new Set([...allCartIds, ...localOnlyWishIds]));
        let validIdSet = new Set(batchIds);
        if (batchIds.length > 0) {
          const batchRes = await fetch(`/api/products/batch?ids=${batchIds.join(",")}`).catch(() => null);
          if (batchRes?.ok) {
            const valid = (await batchRes.json()) as { id: string }[];
            validIdSet = new Set(valid.map((p) => p.id));
          }
        }

        // ── Apply validation + push both in parallel ────────────────────────
        const cleanedCart = mergedCart.filter((i) => validIdSet.has(i.productId));
        setCartItems(cleanedCart);

        const cleanedWishIds = mergedWishIds.filter(
          (id) => validServerWishIds.includes(id) || validIdSet.has(id)
        );
        const wishProductMap = new Map(
          wishServerProducts.map((p: WishlistItem["product"]) => [p!.id, p])
        );
        const mergedWishItems: WishlistItem[] = cleanedWishIds.map((id) => {
          const existing = localWishItems.find((i) => i.productId === id);
          if (existing) return existing;
          return { productId: id, product: wishProductMap.get(id) as WishlistItem["product"], addedAt: new Date() };
        });
        setWishlistItems(mergedWishItems);

        // Push both back to server in parallel
        await Promise.all([
          fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cleanedCart.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                size: i.size,
                color: i.color,
                price: i.price,
              })),
            }),
          }),
          fetch("/api/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: cleanedWishIds }),
          }),
        ]);
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
