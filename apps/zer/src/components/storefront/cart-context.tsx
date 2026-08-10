"use client";

import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { CartItem } from "@/lib/shop-cart";
import {
  cartReducer,
  computeItemCount,
  computeTotalAmount,
} from "@/lib/shop-cart";

export type { CartItem } from "@/lib/shop-cart";

const STORAGE_KEY = "zer-storefront-cart";

type StorefrontCartValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const StorefrontCartContext = createContext<StorefrontCartValue | null>(null);

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    if (!Array.isArray(parsed.items)) return [];
    // JSON.stringify turns Infinity → null; public storefront items are added
    // with maxStock = Number.POSITIVE_INFINITY, so restore it for the reducer.
    return parsed.items.map((item) => ({
      ...item,
      maxStock: Number.isFinite(item.maxStock)
        ? item.maxStock
        : Number.POSITIVE_INFINITY,
    }));
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function StorefrontCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    discount: null,
  });
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadCartFromStorage();
    if (stored.length > 0) {
      dispatch({ type: "LOAD_FROM_STORAGE", payload: stored });
    }
  }, []);

  // Persist to localStorage whenever items change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    saveCartToStorage(state.items);
  }, [state.items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
      // cartReducer ADD_ITEM semantics: increment existing (cap at maxStock),
      // new items start at 1. Loop so a requested quantity > 1 is honored.
      const payload: CartItem = { ...item, quantity: 1 };
      for (let i = 0; i < quantity; i++) {
        dispatch({ type: "ADD_ITEM", payload });
      }
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { cartItemKey: key } });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { cartItemKey: key, quantity },
    });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const value = useMemo<StorefrontCartValue>(
    () => ({
      items: state.items,
      count: computeItemCount(state.items),
      total: computeTotalAmount(state.items),
      addItem,
      removeItem,
      updateQuantity,
      clear,
    }),
    [state.items, addItem, removeItem, updateQuantity, clear],
  );

  return (
    <StorefrontCartContext.Provider value={value}>
      {children}
    </StorefrontCartContext.Provider>
  );
}

export function useStorefrontCart(): StorefrontCartValue {
  const ctx = useContext(StorefrontCartContext);
  if (!ctx) {
    throw new Error(
      "useStorefrontCart must be used within a StorefrontCartProvider",
    );
  }
  return ctx;
}
