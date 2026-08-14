import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSaleInput,
  validateStockMovementInput,
} from "@/lib/domain-rules";
import { isValidPositiveNumber } from "@/lib/erp";

// ─── validateStockMovementInput ───────────────────────────────────────

test("validateStockMovementInput rejects empty product ID", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "",
      type: "in",
      quantity: 10,
    }),
    "Бүтээгдэхүүн сонгоно уу.",
  );
});

test("validateStockMovementInput rejects whitespace-only product ID", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "   ",
      type: "in",
      quantity: 10,
    }),
    "Бүтээгдэхүүн сонгоно уу.",
  );
});

test("validateStockMovementInput rejects invalid type 'out'", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "out",
      quantity: 10,
    }),
    "Хөдөлгөөний төрөл буруу байна.",
  );
});

test("validateStockMovementInput rejects unknown type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "transfer",
      quantity: 10,
    }),
    "Хөдөлгөөний төрөл буруу байна.",
  );
});

test("validateStockMovementInput rejects quantity <= 0 for 'in' type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "in",
      quantity: 0,
    }),
    "Орлогын тоо хэмжээ 0-ээс их байх ёстой.",
  );

  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "in",
      quantity: -1,
    }),
    "Орлогын тоо хэмжээ 0-ээс их байх ёстой.",
  );
});

test("validateStockMovementInput rejects quantity = 0 for 'adjustment' type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "adjustment",
      quantity: 0,
    }),
    "Тохируулгын тоо хэмжээ 0-ээс ялгаатай байх ёстой.",
  );
});

test("validateStockMovementInput accepts positive quantity for 'in' type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "in",
      quantity: 50,
    }),
    null,
  );
});

test("validateStockMovementInput accepts positive quantity for 'adjustment' type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "adjustment",
      quantity: 30,
    }),
    null,
  );
});

test("validateStockMovementInput accepts negative quantity for 'adjustment' type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "adjustment",
      quantity: -20,
    }),
    null,
  );
});

test("validateStockMovementInput validates product ID before type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "",
      type: "invalid",
      quantity: 0,
    }),
    "Бүтээгдэхүүн сонгоно уу.",
  );
});

test("validateStockMovementInput validates type before quantity", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "out",
      quantity: 0,
    }),
    "Хөдөлгөөний төрөл буруу байна.",
  );
});

// ─── validateSaleInput ────────────────────────────────────────────────

test("validateSaleInput rejects empty productId", () => {
  assert.equal(
    validateSaleInput({
      productId: "",
      quantity: 1,
      unitPrice: 5000,
      paidAmount: 5000,
      totalAmount: 5000,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );
});

test("validateSaleInput rejects zero quantity", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 0,
      unitPrice: 5000,
      paidAmount: 5000,
      totalAmount: 5000,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );
});

test("validateSaleInput rejects negative quantity", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: -1,
      unitPrice: 5000,
      paidAmount: 5000,
      totalAmount: 5000,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );
});

test("validateSaleInput rejects negative unitPrice", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: -100,
      paidAmount: 0,
      totalAmount: 0,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );
});

test("validateSaleInput rejects NaN quantity", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: NaN,
      unitPrice: 5000,
      paidAmount: 5000,
      totalAmount: 5000,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );
});

test("validateSaleInput rejects negative paidAmount", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: 5000,
      paidAmount: -1,
      totalAmount: 5000,
    }),
    "Төлсөн дүн 0-ээс их бөгөөд нийт дүнгээс хэтрэхгүй байна.",
  );
});

test("validateSaleInput rejects paidAmount exceeding totalAmount", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: 5000,
      paidAmount: 10000,
      totalAmount: 5000,
    }),
    "Төлсөн дүн 0-ээс их бөгөөд нийт дүнгээс хэтрэхгүй байна.",
  );
});

test("validateSaleInput accepts valid sale with full payment", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 2,
      unitPrice: 5000,
      paidAmount: 10000,
      totalAmount: 10000,
    }),
    null,
  );
});

test("validateSaleInput accepts valid sale with partial payment", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 2,
      unitPrice: 5000,
      paidAmount: 5000,
      totalAmount: 10000,
    }),
    null,
  );
});

test("validateSaleInput accepts zero paidAmount", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: 5000,
      paidAmount: 0,
      totalAmount: 5000,
    }),
    null,
  );
});

test("validateSaleInput accepts zero unitPrice for free items", () => {
  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: 0,
      paidAmount: 0,
      totalAmount: 0,
    }),
    null,
  );
});

// ─── isValidPositiveNumber ────────────────────────────────────────────

test("isValidPositiveNumber returns true for zero", () => {
  assert.equal(isValidPositiveNumber(0), true);
});

test("isValidPositiveNumber returns true for positive number", () => {
  assert.equal(isValidPositiveNumber(100), true);
});

test("isValidPositiveNumber returns false for negative number", () => {
  assert.equal(isValidPositiveNumber(-1), false);
});

test("isValidPositiveNumber returns false for NaN", () => {
  assert.equal(isValidPositiveNumber(NaN), false);
});

test("isValidPositiveNumber returns false for Infinity", () => {
  assert.equal(isValidPositiveNumber(Infinity), false);
});

test("isValidPositiveNumber returns true for large numbers", () => {
  assert.equal(isValidPositiveNumber(999999999), true);
});

// ─── Low stock detection ──────────────────────────────────────────────

test("low stock detection: current_stock < min_stock triggers alert", () => {
  const products = [
    { name: "Product A", currentStock: 2, minStock: 10 },
    { name: "Product B", currentStock: 15, minStock: 10 },
    { name: "Product C", currentStock: 0, minStock: 5 },
  ];

  const lowStockProducts = products.filter((p) => p.currentStock < p.minStock);
  assert.equal(lowStockProducts.length, 2);
  assert.equal(lowStockProducts[0].name, "Product A");
  assert.equal(lowStockProducts[1].name, "Product C");
});

test("low stock detection: no low stock when all products have adequate stock", () => {
  const products = [
    { name: "Product A", currentStock: 20, minStock: 10 },
    { name: "Product B", currentStock: 15, minStock: 10 },
    { name: "Product C", currentStock: 10, minStock: 10 },
  ];

  const lowStockProducts = products.filter((p) => p.currentStock < p.minStock);
  assert.equal(lowStockProducts.length, 0);
});

test("low stock detection: correct count for multiple low stock products", () => {
  const products = [
    { name: "A", currentStock: 1, minStock: 5 },
    { name: "B", currentStock: 2, minStock: 10 },
    { name: "C", currentStock: 3, minStock: 3 },
    { name: "D", currentStock: 0, minStock: 1 },
    { name: "E", currentStock: 10, minStock: 5 },
  ];

  const lowStockProducts = products.filter((p) => p.currentStock < p.minStock);
  assert.equal(lowStockProducts.length, 3);
});

// ─── Stock movement calculations ──────────────────────────────────────

test("stock movement counting: in/out/adjustment counts", () => {
  const movements = [
    { type: "in" },
    { type: "in" },
    { type: "out" },
    { type: "adjustment" },
    { type: "in" },
    { type: "adjustment" },
  ];

  const summary = { in: 0, out: 0, adjustment: 0 };
  for (const m of movements) {
    if (m.type === "in") summary.in += 1;
    else if (m.type === "out") summary.out += 1;
    else if (m.type === "adjustment") summary.adjustment += 1;
  }

  assert.equal(summary.in, 3);
  assert.equal(summary.out, 1);
  assert.equal(summary.adjustment, 2);
});

test("stock movement counting: empty movements yields zero counts", () => {
  const movements: { type: string }[] = [];

  const summary = { in: 0, out: 0, adjustment: 0 };
  for (const m of movements) {
    if (m.type === "in") summary.in += 1;
    else if (m.type === "out") summary.out += 1;
    else if (m.type === "adjustment") summary.adjustment += 1;
  }

  assert.equal(summary.in, 0);
  assert.equal(summary.out, 0);
  assert.equal(summary.adjustment, 0);
});

test("stock value after in movement: currentStock + quantity", () => {
  const currentStock = 10;
  const quantity = 5;
  const newStock = currentStock + quantity;
  assert.equal(newStock, 15);
});

test("stock value after adjustment: currentStock + quantity (can be negative)", () => {
  const currentStock = 10;
  const adjustment = -3;
  const newStock = currentStock + adjustment;
  assert.equal(newStock, 7);
});

test("stock value after adjustment: currentStock + quantity (can be positive)", () => {
  const currentStock = 10;
  const adjustment = 5;
  const newStock = currentStock + adjustment;
  assert.equal(newStock, 15);
});

test("inventory value calculation for multiple products", () => {
  const products = [
    { name: "A", costPrice: 5000, currentStock: 10 },
    { name: "B", costPrice: 3000, currentStock: 20 },
    { name: "C", costPrice: 10000, currentStock: 5 },
  ];

  const totalValue = products.reduce(
    (sum, p) => sum + p.costPrice * p.currentStock,
    0,
  );
  assert.equal(totalValue, 5000 * 10 + 3000 * 20 + 10000 * 5);
  assert.equal(totalValue, 160000);
});

test("sale line item total: quantity * unitPrice", () => {
  const quantity = 3;
  const unitPrice = 5000;
  const totalPrice = quantity * unitPrice;
  assert.equal(totalPrice, 15000);
});

test("sale line item total: zero quantity yields zero", () => {
  const quantity = 0;
  const unitPrice = 5000;
  const totalPrice = quantity * unitPrice;
  assert.equal(totalPrice, 0);
});
