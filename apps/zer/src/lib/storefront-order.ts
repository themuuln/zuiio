import type { CartItem } from "@/lib/shop-cart";

export type StorefrontOrderItem = {
  product_id: string;
  quantity: number;
  variant_id: string;
};

/**
 * Build the `p_items` payload for `submit_shop_order` from cart items.
 * `variant_id: ""` means the base product (no variant).
 * Throws when the cart is empty — an order must contain at least one line.
 */
export function buildOrderItems(items: CartItem[]): StorefrontOrderItem[] {
  if (items.length === 0) {
    throw new Error("Сагс хоосон байна. Захиалга үүсгэх боломжгүй.");
  }
  return items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    variant_id: item.variantId ?? "",
  }));
}

/**
 * Generate a unique idempotency key for a checkout session.
 * The key is created once per checkout session and reused across retries so
 * the RPC returns the same order instead of creating a duplicate.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}
