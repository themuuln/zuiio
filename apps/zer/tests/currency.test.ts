import assert from "node:assert/strict";
import test from "node:test";
import { formatAmount, convertCurrency, toMNT, fromMNT, formatPrice, DEFAULT_CURRENCIES } from "@/lib/currency";

// ─── DEFAULT_CURRENCIES ─────────────────────────────────────────────

test("DEFAULT_CURRENCIES has MNT with rate 1.0", () => {
  const mnt = DEFAULT_CURRENCIES.find((c) => c.code === "MNT");
  assert.ok(mnt, "MNT currency should exist");
  assert.equal(mnt.rate, 1.0);
});

test("DEFAULT_CURRENCIES has expected codes (MNT, USD, CNY, RUB, EUR)", () => {
  const codes = DEFAULT_CURRENCIES.map((c) => c.code);
  assert.deepEqual(codes, ["MNT", "USD", "CNY", "RUB", "EUR"]);
});

// ─── convertCurrency ────────────────────────────────────────────────

test("convertCurrency(100, 3400, 1) converts from USD to MNT", () => {
  assert.equal(convertCurrency(100, 3400, 1), 340000);
});

test("convertCurrency(340000, 1, 3400) converts from MNT to USD", () => {
  assert.equal(convertCurrency(340000, 1, 3400), 100);
});

// ─── toMNT ──────────────────────────────────────────────────────────

test("toMNT(100, 3400) returns 340000", () => {
  assert.equal(toMNT(100, 3400), 340000);
});

test("toMNT(0, 3400) returns 0", () => {
  assert.equal(toMNT(0, 3400), 0);
});

// ─── fromMNT ────────────────────────────────────────────────────────

test("fromMNT(340000, 3400) returns 100", () => {
  assert.equal(fromMNT(340000, 3400), 100);
});

// ─── formatPrice ────────────────────────────────────────────────────

test("formatPrice(1234.56) includes ₮ symbol", () => {
  const result = formatPrice(1234.56);
  assert.ok(result.includes("₮"), `Expected ₮ in "${result}"`);
});

// ─── formatAmount ───────────────────────────────────────────────────

test("formatAmount with currency object returns symbol + formatted amount", () => {
  const result = formatAmount(1234.56, { code: "USD", symbol: "$" });
  assert.ok(result.startsWith("$"), `Expected $ prefix in "${result}"`);
  assert.ok(result.includes("1,234"), `Expected formatted number in "${result}"`);
});

test("formatAmount without currency returns just formatted number", () => {
  const result = formatAmount(1234.56);
  assert.ok(!result.startsWith("$"), `Should not have currency prefix in "${result}"`);
  assert.ok(result.includes("1,234"), `Expected formatted number in "${result}"`);
});
