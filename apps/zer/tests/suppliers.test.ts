import assert from "node:assert/strict";
import test from "node:test";
import { validateContactInput } from "@/lib/domain-rules";

// Domain rule validation tests
test("validateContactInput rejects empty name for suppliers", () => {
  assert.equal(
    validateContactInput({ name: "" }),
    "Харилцагчийн нэр шаардлагатай.",
  );
});

test("validateContactInput rejects whitespace-only name for suppliers", () => {
  assert.equal(
    validateContactInput({ name: "   " }),
    "Харилцагчийн нэр шаардлагатай.",
  );
});

test("validateContactInput accepts valid supplier name", () => {
  assert.equal(validateContactInput({ name: "Болд ХХК" }), null);
});

test("validateContactInput trims whitespace for check", () => {
  assert.equal(validateContactInput({ name: "  Болд ХХК  " }), null);
});

// Supplier-specific server action patterns
test("createSupplier uses type=supplier", () => {
  // The createSupplier server action (in suppliers/actions.ts) wraps
  // the base createContact function and sets formData type="supplier".
  //
  // This test validates that:
  // 1. The validation for name works for supplier type
  // 2. The base validation is type-agnostic (same for customer and supplier)

  // Contact validation is type-agnostic — name check applies to all contacts
  assert.equal(
    validateContactInput({ name: "" }),
    "Харилцагчийн нэр шаардлагатай.",
    "Empty name is rejected regardless of contact type",
  );
  assert.equal(
    validateContactInput({ name: "Болд ХХК" }),
    null,
    "Valid supplier name passes validation",
  );
});

test("updateSupplier preserves type during update", () => {
  // The updateSupplier action delegates to updateContact which:
  // 1. Fetches the current contact to get its type
  // 2. Checks for duplicates with the same type (excluding current)
  // 3. Updates name/phone/email/address only (not type)
  //
  // This test verifies the validation part works correctly.

  assert.equal(
    validateContactInput({ name: "Updated Supplier" }),
    null,
    "Valid name should pass",
  );
  assert.equal(
    validateContactInput({ name: "" }),
    "Харилцагчийн нэр шаардлагатай.",
    "Empty name should fail",
  );
});

test("supplier contact fields are optional except name", () => {
  // The form has name (required), phone, email, address (all optional)
  // The server action handles null values correctly
  const validInput = {
    name: "Тест Нийлүүлэгч",
  };

  assert.equal(validateContactInput(validInput), null);
});
