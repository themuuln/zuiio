import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

mockMod("server-only", {});
mockMod("@zuiio/capture", { capture: mock.fn(() => {}) });
mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({
    auth: {
      getClaims: mock.fn(async () => ({ data: { claims: {} }, error: null })),
    },
  })),
});

let parseAmount: (value: FormDataEntryValue | null) => number;
let isValidPositiveNumber: (value: number) => boolean;
let checkPermission: (permissions: string[], required: string) => string | null;

test.before(async () => {
  const mod = await import("@/lib/erp");
  parseAmount = mod.parseAmount;
  isValidPositiveNumber = mod.isValidPositiveNumber;
  checkPermission = mod.checkPermission;
});

// ── parseAmount ──────────────────────────────────────────────────────────────

test("parseAmount: null returns 0", () => {
  assert.equal(parseAmount(null), 0);
});

test("parseAmount: empty string returns 0", () => {
  assert.equal(parseAmount(""), 0);
});

test("parseAmount: '123.45' returns 123.45", () => {
  assert.equal(parseAmount("123.45"), 123.45);
});

test("parseAmount: non-numeric string returns 0", () => {
  assert.equal(parseAmount("abc"), 0);
});

test("parseAmount: '0' returns 0", () => {
  assert.equal(parseAmount("0"), 0);
});

// ── isValidPositiveNumber ────────────────────────────────────────────────────

test("isValidPositiveNumber: 100 → true", () => {
  assert.equal(isValidPositiveNumber(100), true);
});

test("isValidPositiveNumber: 0 → true", () => {
  assert.equal(isValidPositiveNumber(0), true);
});

test("isValidPositiveNumber: -1 → false", () => {
  assert.equal(isValidPositiveNumber(-1), false);
});

test("isValidPositiveNumber: NaN → false", () => {
  assert.equal(isValidPositiveNumber(NaN), false);
});

// ── checkPermission ──────────────────────────────────────────────────────────

test("checkPermission: has permission → null", () => {
  assert.equal(
    checkPermission(["products.create", "products.read"], "products.create"),
    null,
  );
});

test("checkPermission: missing permission → error string", () => {
  assert.equal(
    checkPermission(["products.read"], "products.delete"),
    "Танд эрх байхгүй байна.",
  );
});

test("checkPermission: empty array → error string", () => {
  assert.equal(checkPermission([], "products.read"), "Танд эрх байхгүй байна.");
});
