/**
 * Pure cart logic — no React, no storage. Fully unit-testable.
 */

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  unit: string | null;
  imageUrl: string | null;
  quantity: number;
  /** Optional stock cap from the backend (public RPC doesn't expose stock). */
  maxQuantity?: number;
}

export const MAX_ITEM_QUANTITY = 99;

export type NewCartItem = Omit<CartItem, "quantity"> & { quantity?: number };

function clampQuantity(quantity: number, max?: number): number {
  const upper =
    max && max > 0 ? Math.min(max, MAX_ITEM_QUANTITY) : MAX_ITEM_QUANTITY;
  return Math.min(Math.max(Math.round(quantity), 1), upper);
}

/** Add an item (merging by productId) or bump quantity of an existing one. */
export function addItemToCart(
  items: CartItem[],
  item: NewCartItem,
): CartItem[] {
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === item.productId
        ? {
            ...i,
            quantity: clampQuantity(
              i.quantity + (item.quantity ?? 1),
              item.maxQuantity ?? i.maxQuantity,
            ),
            unitPrice: item.unitPrice,
            imageUrl: item.imageUrl ?? i.imageUrl,
          }
        : i,
    );
  }
  return [
    ...items,
    {
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      unit: item.unit ?? null,
      imageUrl: item.imageUrl ?? null,
      quantity: clampQuantity(item.quantity ?? 1, item.maxQuantity),
      maxQuantity: item.maxQuantity,
    },
  ];
}

/** Remove an item entirely. */
export function removeItemFromCart(
  items: CartItem[],
  productId: string,
): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

/** Set an item's quantity; quantities <= 0 remove the item. */
export function setItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return removeItemFromCart(items, productId);
  return items.map((i) =>
    i.productId === productId
      ? { ...i, quantity: clampQuantity(quantity, i.maxQuantity) }
      : i,
  );
}

export function cartTotals(items: CartItem[]): {
  itemCount: number;
  totalAmount: number;
} {
  let itemCount = 0;
  let totalAmount = 0;
  for (const item of items) {
    itemCount += item.quantity;
    totalAmount += item.unitPrice * item.quantity;
  }
  // Avoid floating-point drift (prices have at most 2 decimals).
  totalAmount = Math.round(totalAmount * 100) / 100;
  return { itemCount, totalAmount };
}
