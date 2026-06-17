import assert from "node:assert/strict";
import test from "node:test";
import type { DiscountParams } from "@/lib/discount-utils";
import { calculateDiscount } from "@/lib/discount-utils";

test("percentage discount on all items", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 10,
    cartTotal: 100000,
    appliesTo: "all",
    items: [
      { productId: "p1", price: 50000, quantity: 1 },
      { productId: "p2", price: 50000, quantity: 1 },
    ],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 10000);
  assert.equal(result.totalAfterDiscount, 90000);
  assert.ok(result.description.includes("10%"));
});

test("fixed amount discount on all items", () => {
  const params: DiscountParams = {
    discountType: "fixed_amount",
    discountValue: 5000,
    cartTotal: 100000,
    appliesTo: "all",
    items: [
      { productId: "p1", price: 50000, quantity: 2 },
    ],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 5000);
  assert.equal(result.totalAfterDiscount, 95000);
});

test("fixed amount discount capped at cart total", () => {
  const params: DiscountParams = {
    discountType: "fixed_amount",
    discountValue: 200000,
    cartTotal: 100000,
    appliesTo: "all",
    items: [
      { productId: "p1", price: 100000, quantity: 1 },
    ],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 100000);
  assert.equal(result.totalAfterDiscount, 0);
});

test("percentage discount on selected products", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 20,
    cartTotal: 100000,
    appliesTo: "selected_products",
    items: [
      { productId: "p1", categoryId: "c1", price: 30000, quantity: 1 },
      { productId: "p2", categoryId: "c2", price: 70000, quantity: 1 },
    ],
    conditions: [
      { condition_type: "product", condition_value: "p1" },
    ],
  };
  const result = calculateDiscount(params);
  // Discount applies only to p1: 30000 * 20% = 6000
  assert.equal(result.discountAmount, 6000);
  assert.equal(result.totalAfterDiscount, 94000);
});

test("percentage discount on selected categories", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 15,
    cartTotal: 200000,
    appliesTo: "selected_categories",
    items: [
      { productId: "p1", categoryId: "c1", price: 80000, quantity: 1 },
      { productId: "p2", categoryId: "c2", price: 120000, quantity: 1 },
    ],
    conditions: [
      { condition_type: "category", condition_value: "c1" },
    ],
  };
  const result = calculateDiscount(params);
  // Discount applies only to c1 items: 80000 * 15% = 12000
  assert.equal(result.discountAmount, 12000);
  assert.equal(result.totalAfterDiscount, 188000);
});

test("no discount when no items match selected products", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 10,
    cartTotal: 50000,
    appliesTo: "selected_products",
    items: [
      { productId: "p1", price: 50000, quantity: 1 },
    ],
    conditions: [
      { condition_type: "product", condition_value: "p2" },
    ],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.totalAfterDiscount, 50000);
  assert.ok(result.description);
});

test("zero discount value returns no discount", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 0,
    cartTotal: 100000,
    appliesTo: "all",
    items: [{ productId: "p1", price: 100000, quantity: 1 }],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.totalAfterDiscount, 100000);
});

test("zero cart total returns no discount", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 10,
    cartTotal: 0,
    appliesTo: "all",
    items: [],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.totalAfterDiscount, 0);
});

test("selected_products without conditions returns no discount", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 10,
    cartTotal: 50000,
    appliesTo: "selected_products",
    items: [{ productId: "p1", price: 50000, quantity: 1 }],
    conditions: [],
  };
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.totalAfterDiscount, 50000);
});

test("percentage discount on multiple items in selected category", () => {
  const params: DiscountParams = {
    discountType: "percentage",
    discountValue: 25,
    cartTotal: 240000,
    appliesTo: "selected_categories",
    items: [
      { productId: "p1", categoryId: "c1", price: 40000, quantity: 2 },
      { productId: "p2", categoryId: "c1", price: 60000, quantity: 1 },
      { productId: "p3", categoryId: "c2", price: 100000, quantity: 1 },
    ],
    conditions: [
      { condition_type: "category", condition_value: "c1" },
    ],
  };
  // Applicable subtotal: p1(80000) + p2(60000) = 140000
  // Discount: 140000 * 25% = 35000
  const result = calculateDiscount(params);
  assert.equal(result.discountAmount, 35000);
  assert.equal(result.totalAfterDiscount, 205000);
});
