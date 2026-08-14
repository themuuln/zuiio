"use client";

import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Client-side wishlist — localStorage only, no backend. Items are product
 * ids persisted under `wishlist:<slug>` so each storefront org keeps its own
 * list. SSR-safe: the list is hydrated from localStorage on mount, and
 * toggling before hydration falls back to the in-memory list.
 */
type WishlistValue = {
  items: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

function loadWishlistFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Only accept string product ids; dedupe defensively.
    return Array.from(new Set(parsed.filter((id) => typeof id === "string")));
  } catch {
    return [];
  }
}

function saveWishlistToStorage(key: string, items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently fail.
  }
}

export function WishlistProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  // Idempotent provider — the storefront shell hoists it in
  // [slug]/layout.tsx, so nested page-level providers pass through to keep a
  // single wishlist context per storefront. The early return lives in a
  // wrapper so the inner provider's hooks stay unconditional.
  const parent = useContext(WishlistContext);
  if (parent) return <>{children}</>;
  return <WishlistProviderInner slug={slug}>{children}</WishlistProviderInner>;
}

function WishlistProviderInner({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const storageKey = `wishlist:${slug}`;
  const [items, setItems] = useState<string[]>([]);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadWishlistFromStorage(storageKey);
    if (stored.length > 0) {
      setItems(stored);
    }
  }, [storageKey]);

  // Persist to localStorage whenever the list changes (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    saveWishlistToStorage(storageKey, items);
  }, [storageKey, items]);

  const toggle = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => items.includes(productId),
    [items],
  );

  const value = useMemo<WishlistValue>(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      toggle,
    }),
    [items, isWishlisted, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
