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
import type { CartItem, DiscountInfo } from "@/lib/shop-cart";
import {
  cartReducer,
  computeDiscountedTotal,
  computeItemCount,
  computeTotalAmount,
} from "@/lib/shop-cart";

export type { CartItem, DiscountInfo } from "@/lib/shop-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  discountedTotal: number;
  discount: DiscountInfo | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyDiscount: (discount: DiscountInfo) => void;
  removeDiscount: () => void;
  clearCart: () => void;
};

const STORAGE_KEY = "zer-shop-cart";
const DISCOUNT_STORAGE_KEY = "zer-shop-discount";

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

function loadDiscountFromStorage(): DiscountInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiscountInfo;
  } catch {
    return null;
  }
}

function saveDiscountToStorage(discount: DiscountInfo | null) {
  if (typeof window === "undefined") return;
  try {
    if (discount) {
      sessionStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount));
    } else {
      sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
    }
  } catch {
    // Storage full or unavailable — silently fail
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    discount: null,
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
      const storedDiscount = loadDiscountFromStorage();
      if (storedDiscount) {
        dispatch({ type: "APPLY_DISCOUNT", payload: storedDiscount });
      }
    }
  }, []);

  // Persist to storage on change
  React.useEffect(() => {
    if (initialized.current) {
      saveCartToStorage(state.items);
    }
  }, [state.items]);

  // Persist discount to storage on change
  React.useEffect(() => {
    if (initialized.current) {
      saveDiscountToStorage(state.discount);
    }
  }, [state.discount]);

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

  const applyDiscount = useCallback((discount: DiscountInfo) => {
    dispatch({ type: "APPLY_DISCOUNT", payload: discount });
  }, []);

  const removeDiscount = useCallback(() => {
    dispatch({ type: "REMOVE_DISCOUNT" });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalAmount = useMemo(
    () => computeTotalAmount(state.items),
    [state.items],
  );
  const discountedTotal = useMemo(
    () => computeDiscountedTotal(totalAmount, state.discount?.discountAmount ?? 0),
    [totalAmount, state.discount],
  );
  const itemCount = useMemo(() => computeItemCount(state.items), [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      itemCount,
      totalAmount,
      discountedTotal,
      discount: state.discount,
      addItem,
      removeItem,
      updateQuantity,
      applyDiscount,
      removeDiscount,
      clearCart,
    }),
    [state.items, state.discount, itemCount, totalAmount, discountedTotal, addItem, removeItem, updateQuantity, applyDiscount, removeDiscount, clearCart],
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
