"use client";

import { capture } from "@zuiio/capture";
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
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
  applyDiscount: (discount: DiscountInfo) => void;
  removeDiscount: () => void;
  clearCart: () => void;
  holdSale: () => void;
  restoreHeldSale: (id: string) => void;
  removeHeldSale: (id: string) => void;
};

const STORAGE_KEY = "zer-shop-cart";
const DISCOUNT_STORAGE_KEY = "zer-shop-discount";
const FREQUENCY_STORAGE_KEY = "zer:shop:product-frequency";

type FrequencyMap = Record<string, number>;

function bumpFrequency(productId: string) {
  if (typeof window === "undefined" || !productId) return;
  try {
    const raw = window.localStorage.getItem(FREQUENCY_STORAGE_KEY);
    const map: FrequencyMap = raw ? (JSON.parse(raw) as FrequencyMap) : {};
    map[productId] = (map[productId] ?? 0) + 1;
    window.localStorage.setItem(FREQUENCY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable — silently skip frequency tracking
  }
}

export function getProductFrequency(): FrequencyMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FREQUENCY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FrequencyMap) : {};
  } catch {
    return {};
  }
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (e) {
    capture(e, { context: "cart: load from storage" });
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    capture(e, { context: "cart: save to storage" });
    // Storage full or unavailable — silently fail
  }
}

function loadDiscountFromStorage(): DiscountInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiscountInfo;
  } catch (e) {
    capture(e, { context: "cart: load discount from storage" });
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
  } catch (e) {
    capture(e, { context: "cart: save discount to storage" });
    // Storage full or unavailable — silently fail
  }
}

type HeldSale = {
  id: string;
  items: CartItem[];
  discount: DiscountInfo | null;
  heldAt: string;
};

export const HELD_SALES_KEY = "zer:shop:held-sales";

function loadHeldSales(): HeldSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HELD_SALES_KEY);
    return raw ? (JSON.parse(raw) as HeldSale[]) : [];
  } catch (e) {
    capture(e, { context: "cart: load held sales" });
    return [];
  }
}

function saveHeldSales(sales: HeldSale[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HELD_SALES_KEY, JSON.stringify(sales));
  } catch (e) {
    capture(e, { context: "cart: save held sales" });
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

  // Persist to storage on change (debounced to avoid write storm during rapid mutations)
  const saveTimerRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (initialized.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(
        () => saveCartToStorage(state.items),
        300,
      );
    }
    return () => window.clearTimeout(saveTimerRef.current);
  }, [state.items]);

  // Persist discount to storage on change
  React.useEffect(() => {
    if (initialized.current) {
      saveDiscountToStorage(state.discount);
    }
  }, [state.discount]);
  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const holdSale = useCallback(() => {
    const held: HeldSale = {
      id: `held-${Date.now()}`,
      items: state.items,
      discount: state.discount,
      heldAt: new Date().toISOString(),
    };
    const next = [...loadHeldSales(), held];
    saveHeldSales(next);
    dispatch({ type: "CLEAR_CART" });
  }, [state.items, state.discount]);

  const restoreHeldSale = useCallback((id: string) => {
    const held = loadHeldSales().find((s) => s.id === id);
    if (!held) return;
    // JSON.stringify turns Infinity → null; restore it so the cart reducer works
    const sanitized = held.items.map((i) => ({
      ...i,
      maxStock: Number.isFinite(i.maxStock)
        ? i.maxStock
        : Number.POSITIVE_INFINITY,
    }));
    dispatch({ type: "LOAD_FROM_STORAGE", payload: sanitized });
    if (held.discount) {
      dispatch({ type: "APPLY_DISCOUNT", payload: held.discount });
    } else {
      dispatch({ type: "REMOVE_DISCOUNT" });
    }
    const next = loadHeldSales().filter((s) => s.id !== id);
    saveHeldSales(next);
  }, []);

  const removeHeldSale = useCallback((id: string) => {
    const next = loadHeldSales().filter((s) => s.id !== id);
    saveHeldSales(next);
  }, []);
  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    bumpFrequency(item.productId);
    dispatch({
      type: "ADD_ITEM",
      payload: { ...item, quantity: 1 },
    });
  }, []);
  const removeItem = useCallback((cartItemKey: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { cartItemKey } });
  }, []);

  const updateQuantity = useCallback(
    (cartItemKey: string, quantity: number) => {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { cartItemKey, quantity },
      });
    },
    [],
  );

  const applyDiscount = useCallback((discount: DiscountInfo) => {
    dispatch({ type: "APPLY_DISCOUNT", payload: discount });
  }, []);

  const removeDiscount = useCallback(() => {
    dispatch({ type: "REMOVE_DISCOUNT" });
  }, []);

  const totalAmount = useMemo(
    () => computeTotalAmount(state.items),
    [state.items],
  );
  const discountedTotal = useMemo(
    () =>
      computeDiscountedTotal(totalAmount, state.discount?.discountAmount ?? 0),
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
      holdSale,
      restoreHeldSale,
      removeHeldSale,
    }),
    [
      state.items,
      state.discount,
      itemCount,
      totalAmount,
      discountedTotal,
      addItem,
      removeItem,
      updateQuantity,
      applyDiscount,
      removeDiscount,
      clearCart,
      holdSale,
      restoreHeldSale,
      removeHeldSale,
    ],
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
