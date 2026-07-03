"use client";

import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
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

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "zer-shop-cart";

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
  });
  const initialized = useRef(false);

  // Load from storage on mount (preserving quantities)
  React.useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const stored = loadCartFromStorage();
      if (stored.length > 0) {
        dispatch({ type: "LOAD_FROM_STORAGE", payload: stored });
      }
    }
  }, []);

  // Persist to storage on change
  React.useEffect(() => {
    if (initialized.current) {
      saveCartToStorage(state.items);
    }
  }, [state.items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({
      type: "ADD_ITEM",
      payload: { ...item, quantity: 1 },
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { productId, quantity },
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const value = useMemo(
    () => ({
      items: state.items,
      itemCount: computeItemCount(state.items),
      totalAmount: computeTotalAmount(state.items),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [state.items, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
