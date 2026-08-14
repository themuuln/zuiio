import assert from "node:assert/strict";
import test from "node:test";
import type { CartItem } from "@/lib/shop-cart";
import { buildOrderItems, createIdempotencyKey } from "@/lib/storefront-order";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "product-1",
    name: "Тест бүтээгдэхүүн",
    unitPrice: 5000,
    quantity: 2,
    unit: "ш",
    maxStock: 10,
    ...overrides,
  };
}

test("buildOrderItems maps base product items", () => {
  const items = [makeItem()];
  const result = buildOrderItems(items);
  assert.deepEqual(result, [
    { product_id: "product-1", quantity: 2, variant_id: "" },
  ]);
});

test("buildOrderItems maps variant items with variant_id", () => {
  const items = [makeItem({ variantId: "variant-9", quantity: 1 })];
  const result = buildOrderItems(items);
  assert.deepEqual(result, [
    { product_id: "product-1", quantity: 1, variant_id: "variant-9" },
  ]);
});

test("buildOrderItems maps multiple mixed items in order", () => {
  const items = [
    makeItem({ productId: "product-1", quantity: 2 }),
    makeItem({
      productId: "product-2",
      name: "Тест 2",
      variantId: "variant-3",
      quantity: 1,
    }),
    makeItem({ productId: "product-3", name: "Тест 3", quantity: 4 }),
  ];
  const result = buildOrderItems(items);
  assert.deepEqual(result, [
    { product_id: "product-1", quantity: 2, variant_id: "" },
    { product_id: "product-2", quantity: 1, variant_id: "variant-3" },
    { product_id: "product-3", quantity: 4, variant_id: "" },
  ]);
});

test("buildOrderItems throws on empty items", () => {
  assert.throws(() => buildOrderItems([]));
});

test("createIdempotencyKey returns unique UUID-formatted keys", () => {
  const a = createIdempotencyKey();
  const b = createIdempotencyKey();
  assert.notEqual(a, b);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  assert.match(a, uuidPattern);
  assert.match(b, uuidPattern);
});
