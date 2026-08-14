import assert from "node:assert/strict";
import test from "node:test";
import { validateStockMovementInput } from "@/lib/domain-rules";

test("batch adjustment — validate items", () => {
  // Reject empty product ID
  assert.equal(
    validateStockMovementInput({
      productId: "",
      type: "adjustment",
      quantity: 10,
    }),
    "Бүтээгдэхүүн сонгоно уу.",
  );

  // Accept valid adjustment item with any non-zero quantity
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "adjustment",
      quantity: 5,
    }),
    null,
  );

  // Accept 'in' type with positive quantity
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "in",
      quantity: 10,
    }),
    null,
  );
});

test("batch adjustment — rejects invalid type 'out'", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "out",
      quantity: 5,
    }),
    "Хөдөлгөөний төрөл буруу байна.",
  );
});

test("batch adjustment — accepts large quantities", () => {
  assert.equal(
    validateStockMovementInput({
      productId: "product-1",
      type: "adjustment",
      quantity: 999999,
    }),
    null,
  );
});
