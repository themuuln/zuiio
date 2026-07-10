import assert from "node:assert/strict";
import test from "node:test";
import { validateProductInput } from "@/lib/domain-rules";

// ─── validateProductInput ─────────────────────────────────────────────

test("validateProductInput rejects empty name", () => {
  assert.equal(
    validateProductInput({
      name: "",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    "Бүтээгдэхүүний нэр шаардлагатай.",
  );
});

test("validateProductInput rejects whitespace-only name", () => {
  assert.equal(
    validateProductInput({
      name: "   ",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    "Бүтээгдэхүүний нэр шаардлагатай.",
  );
});

test("validateProductInput rejects negative costPrice", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: -1,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput rejects negative salePrice", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: -500,
      currentStock: 10,
      minStock: 5,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput rejects negative currentStock", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: -1,
      minStock: 5,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput rejects negative minStock", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 10,
      minStock: -1,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput rejects NaN values", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: NaN,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput rejects Infinity values", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: Infinity,
      currentStock: 10,
      minStock: 5,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );
});

test("validateProductInput accepts zero costPrice", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 0,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    null,
  );
});

test("validateProductInput accepts zero currentStock", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 0,
      minStock: 5,
    }),
    null,
  );
});

test("validateProductInput accepts valid product", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    null,
  );
});

test("validateProductInput accepts product with zero minStock", () => {
  assert.equal(
    validateProductInput({
      name: "Тест бүтээгдэхүүн",
      costPrice: 500,
      salePrice: 1500,
      currentStock: 20,
      minStock: 0,
    }),
    null,
  );
});

test("validateProductInput trims whitespace for name check", () => {
  assert.equal(
    validateProductInput({
      name: "  Тест бүтээгдэхүүн  ",
      costPrice: 1000,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    }),
    null,
  );
});

// ─── Stock calculations ───────────────────────────────────────────────

test("inventory value calculation: costPrice * currentStock", () => {
  const costPrice = 5000;
  const currentStock = 10;
  const inventoryValue = costPrice * currentStock;
  assert.equal(inventoryValue, 50000);
});

test("inventory value calculation: zero stock yields zero value", () => {
  const costPrice = 5000;
  const currentStock = 0;
  const inventoryValue = costPrice * currentStock;
  assert.equal(inventoryValue, 0);
});

test("inventory value calculation: zero cost price yields zero value", () => {
  const costPrice = 0;
  const currentStock = 10;
  const inventoryValue = costPrice * currentStock;
  assert.equal(inventoryValue, 0);
});

test("inventory value calculation: large numbers", () => {
  const costPrice = 100000;
  const currentStock = 50;
  const inventoryValue = costPrice * currentStock;
  assert.equal(inventoryValue, 5000000);
});

test("low stock detection: current < min is low stock", () => {
  const currentStock = 2;
  const minStock = 10;
  const isLowStock = currentStock < minStock;
  assert.equal(isLowStock, true);
});

test("low stock detection: current === min is not low stock", () => {
  const currentStock = 10;
  const minStock = 10;
  const isLowStock = currentStock < minStock;
  assert.equal(isLowStock, false);
});

test("low stock detection: current > min is not low stock", () => {
  const currentStock = 15;
  const minStock = 10;
  const isLowStock = currentStock < minStock;
  assert.equal(isLowStock, false);
});

test("low stock detection: zero stock is low when minStock > 0", () => {
  const currentStock = 0;
  const minStock = 5;
  const isLowStock = currentStock < minStock;
  assert.equal(isLowStock, true);
});

test("gross profit calculation: revenue - cost", () => {
  const revenue = 100000;
  const cost = 60000;
  const grossProfit = revenue - cost;
  assert.equal(grossProfit, 40000);
});

test("gross profit calculation: zero revenue yields negative profit equal to cost", () => {
  const revenue = 0;
  const cost = 50000;
  const grossProfit = revenue - cost;
  assert.equal(grossProfit, -50000);
});

test("profit margin calculation: (profit / revenue) * 100", () => {
  const revenue = 100000;
  const cost = 60000;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  assert.equal(margin, 40);
});

test("profit margin calculation: zero revenue yields zero margin", () => {
  const revenue = 0;
  const cost = 5000;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  assert.equal(margin, 0);
});
