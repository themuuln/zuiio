import assert from "node:assert/strict";
import test from "node:test";
import type { CartItem, CartState } from "@/lib/shop-cart";
import {
  cartReducer,
  computeItemCount,
  computeTotalAmount,
  validateCartItem,
  validateCartQuantity,
} from "@/lib/shop-cart";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "product-1",
    name: "Тест бүтээгдэхүүн",
    unitPrice: 5000,
    quantity: 1,
    unit: "ш",
    maxStock: 10,
    ...overrides,
  };
}

function makeState(items: CartItem[] = []): CartState {
  return { items };
}

test("ADD_ITEM adds new item with quantity 1", () => {
  const state = makeState();
  const next = cartReducer(state, {
    type: "ADD_ITEM",
    payload: makeItem(),
  });
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].productId, "product-1");
  assert.equal(next.items[0].quantity, 1);
});

test("ADD_ITEM increments quantity for existing item", () => {
  const state = makeState([makeItem({ quantity: 2 })]);
  const next = cartReducer(state, {
    type: "ADD_ITEM",
    payload: makeItem(),
  });
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].quantity, 3);
});

test("ADD_ITEM caps quantity at maxStock", () => {
  const state = makeState([makeItem({ quantity: 10, maxStock: 10 })]);
  const next = cartReducer(state, {
    type: "ADD_ITEM",
    payload: makeItem({ maxStock: 10 }),
  });
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].quantity, 10);
});

test("ADD_ITEM adds multiple different items", () => {
  const state = makeState([makeItem()]);
  const next = cartReducer(state, {
    type: "ADD_ITEM",
    payload: makeItem({ productId: "product-2", name: "Тест 2" }),
  });
  assert.equal(next.items.length, 2);
});

test("REMOVE_ITEM removes item by productId", () => {
  const state = makeState([
    makeItem(),
    makeItem({ productId: "product-2", name: "Тест 2" }),
  ]);
  const next = cartReducer(state, {
    type: "REMOVE_ITEM",
    payload: { productId: "product-1" },
  });
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].productId, "product-2");
});

test("REMOVE_ITEM on non-existent item does nothing", () => {
  const state = makeState([makeItem()]);
  const next = cartReducer(state, {
    type: "REMOVE_ITEM",
    payload: { productId: "nonexistent" },
  });
  assert.equal(next.items.length, 1);
});

test("UPDATE_QUANTITY updates quantity", () => {
  const state = makeState([makeItem()]);
  const next = cartReducer(state, {
    type: "UPDATE_QUANTITY",
    payload: { productId: "product-1", quantity: 5 },
  });
  assert.equal(next.items[0].quantity, 5);
});

test("UPDATE_QUANTITY caps at maxStock", () => {
  const state = makeState([makeItem({ maxStock: 5 })]);
  const next = cartReducer(state, {
    type: "UPDATE_QUANTITY",
    payload: { productId: "product-1", quantity: 10 },
  });
  assert.equal(next.items[0].quantity, 5);
});

test("UPDATE_QUANTITY removes item when quantity <= 0", () => {
  const state = makeState([makeItem()]);
  const next = cartReducer(state, {
    type: "UPDATE_QUANTITY",
    payload: { productId: "product-1", quantity: 0 },
  });
  assert.equal(next.items.length, 0);
});

test("CLEAR_CART empties all items", () => {
  const state = makeState([makeItem(), makeItem({ productId: "product-2" })]);
  const next = cartReducer(state, { type: "CLEAR_CART" });
  assert.equal(next.items.length, 0);
});

test("LOAD_FROM_STORAGE replaces all items preserving quantities", () => {
  const state = makeState([makeItem()]);
  const stored = [
    makeItem({ quantity: 3 }),
    makeItem({ productId: "product-2", quantity: 2 }),
  ];
  const next = cartReducer(state, {
    type: "LOAD_FROM_STORAGE",
    payload: stored,
  });
  assert.equal(next.items.length, 2);
  assert.equal(next.items[0].quantity, 3);
  assert.equal(next.items[1].quantity, 2);
});

test("computeTotalAmount sums unitPrice * quantity for all items", () => {
  const items = [
    makeItem({ unitPrice: 5000, quantity: 2 }),
    makeItem({ productId: "product-2", unitPrice: 3000, quantity: 3 }),
  ];
  assert.equal(computeTotalAmount(items), 5000 * 2 + 3000 * 3);
});

test("computeTotalAmount returns 0 for empty cart", () => {
  assert.equal(computeTotalAmount([]), 0);
});

test("computeItemCount sums all quantities", () => {
  const items = [
    makeItem({ quantity: 2 }),
    makeItem({ productId: "product-2", quantity: 3 }),
  ];
  assert.equal(computeItemCount(items), 5);
});

test("computeItemCount returns 0 for empty cart", () => {
  assert.equal(computeItemCount([]), 0);
});

test("validateCartQuantity rejects quantity < 1", () => {
  const result = validateCartQuantity(0, 10);
  assert.notEqual(result, null);
});

test("validateCartQuantity rejects quantity > maxStock", () => {
  const result = validateCartQuantity(11, 10);
  assert.notEqual(result, null);
});

test("validateCartQuantity accepts valid quantity", () => {
  assert.equal(validateCartQuantity(1, 10), null);
  assert.equal(validateCartQuantity(5, 10), null);
  assert.equal(validateCartQuantity(10, 10), null);
});

test("validateCartItem rejects empty productId", () => {
  assert.notEqual(
    validateCartItem({
      productId: "",
      name: "Test",
      unitPrice: 100,
      maxStock: 10,
    }),
    null,
  );
});

test("validateCartItem rejects empty name", () => {
  assert.notEqual(
    validateCartItem({
      productId: "id",
      name: "  ",
      unitPrice: 100,
      maxStock: 10,
    }),
    null,
  );
});

test("validateCartItem rejects negative price", () => {
  assert.notEqual(
    validateCartItem({
      productId: "id",
      name: "Test",
      unitPrice: -1,
      maxStock: 10,
    }),
    null,
  );
});

test("validateCartItem rejects zero or negative stock", () => {
  assert.notEqual(
    validateCartItem({
      productId: "id",
      name: "Test",
      unitPrice: 100,
      maxStock: 0,
    }),
    null,
  );
  assert.notEqual(
    validateCartItem({
      productId: "id",
      name: "Test",
      unitPrice: 100,
      maxStock: -1,
    }),
    null,
  );
});

test("validateCartItem accepts valid item", () => {
  assert.equal(
    validateCartItem({
      productId: "id",
      name: "Test",
      unitPrice: 100,
      maxStock: 5,
    }),
    null,
  );
});

test("duplicate ADD_ITEM increments existing quantity (VAL-SHOP-010)", () => {
  const state = makeState();
  const item = makeItem();
  const first = cartReducer(state, { type: "ADD_ITEM", payload: item });
  const second = cartReducer(first, { type: "ADD_ITEM", payload: item });
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].quantity, 2);
});

test("quantity stays at max when reaching stock limit (VAL-SHOP-015/016)", () => {
  const state = makeState([makeItem({ maxStock: 3 })]);
  const s1 = cartReducer(state, {
    type: "ADD_ITEM",
    payload: makeItem({ maxStock: 3 }),
  });
  const s2 = cartReducer(s1, {
    type: "ADD_ITEM",
    payload: makeItem({ maxStock: 3 }),
  });
  assert.equal(s2.items[0].quantity, 3);
  // Adding more should not exceed maxStock
  const s3 = cartReducer(s2, {
    type: "ADD_ITEM",
    payload: makeItem({ maxStock: 3 }),
  });
  assert.equal(s3.items[0].quantity, 3);
});

test("remove item and verify empty state (VAL-SHOP-017)", () => {
  const state = makeState([makeItem()]);
  const afterRemove = cartReducer(state, {
    type: "REMOVE_ITEM",
    payload: { productId: "product-1" },
  });
  assert.equal(afterRemove.items.length, 0);
});

test("cart cleared after checkout simulation (VAL-SHOP-022)", () => {
  const state = makeState([makeItem({ quantity: 2 })]);
  const cleared = cartReducer(state, { type: "CLEAR_CART" });
  assert.equal(cleared.items.length, 0);
  assert.equal(computeTotalAmount(cleared.items), 0);
  assert.equal(computeItemCount(cleared.items), 0);
});
