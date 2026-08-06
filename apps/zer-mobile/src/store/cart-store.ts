import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addItemToCart,
  type CartItem,
  cartTotals,
  removeItemFromCart,
  setItemQuantity,
} from "@/lib/cart";
import { appStorage, type KvStorage } from "@/lib/storage";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const INITIAL_ITEMS: CartItem[] = [];

/**
 * Zustand cart store with persistence. Factory takes an optional storage
 * (unit tests pass in-memory fakes); the app singleton uses AsyncStorage.
 */
export function createCartStore(storage?: KvStorage) {
  return create<CartState>()(
    persist(
      (set) => ({
        items: INITIAL_ITEMS,
        addItem: (item) =>
          set((s) => ({ items: addItemToCart(s.items, item) })),
        removeItem: (productId) =>
          set((s) => ({ items: removeItemFromCart(s.items, productId) })),
        setQuantity: (productId, quantity) =>
          set((s) => ({
            items: setItemQuantity(s.items, productId, quantity),
          })),
        clear: () => set({ items: INITIAL_ITEMS }),
      }),
      {
        name: "zer-mobile:cart",
        storage: createJSONStorage(() => storage ?? appStorage),
        partialize: (s) => ({ items: s.items }),
      },
    ),
  );
}

export const useCartStore = createCartStore();

/** Selector helpers — stable identities for React components. */
export const selectItemCount = (s: CartState) => cartTotals(s.items).itemCount;
export const selectTotalAmount = (s: CartState) =>
  cartTotals(s.items).totalAmount;
export const selectItems = (s: CartState) => s.items;
