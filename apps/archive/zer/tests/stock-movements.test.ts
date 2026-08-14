import assert from "node:assert/strict";
import test from "node:test";
import { validateStockMovementInput } from "@/lib/domain-rules";

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

test("validateStockMovementInput rejects invalid type", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "out",
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
      quantity: -5,
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
