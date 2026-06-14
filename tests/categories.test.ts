import assert from "node:assert/strict";
import test from "node:test";
import { validateCategoryInput } from "@/lib/domain-rules";

test("validateCategoryInput rejects empty name", () => {
  assert.equal(
    validateCategoryInput({ name: "" }),
    "Ангиллын нэр шаардлагатай.",
  );
});

test("validateCategoryInput rejects whitespace-only name", () => {
  assert.equal(
    validateCategoryInput({ name: "   " }),
    "Ангиллын нэр шаардлагатай.",
  );
});

test("validateCategoryInput accepts valid name", () => {
  assert.equal(validateCategoryInput({ name: "Хоол, ундаа" }), null);
});

test("validateCategoryInput accepts single character name", () => {
  assert.equal(validateCategoryInput({ name: "А" }), null);
});

test("validateCategoryInput trims whitespace for check", () => {
  assert.equal(
    validateCategoryInput({ name: "  Хоол  " }),
    null,
  );
});
