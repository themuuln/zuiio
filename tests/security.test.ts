import assert from "node:assert/strict";
import test from "node:test";
import { checkPermission } from "@/lib/erp";
import { escapeHtml } from "@/lib/validation";

// ─── checkPermission ─────────────────────────────────────────────────

test("checkPermission returns null when permission is present", () => {
  assert.equal(
    checkPermission(["products.create", "products.read"], "products.create"),
    null,
  );
});

test("checkPermission returns error when permission is missing", () => {
  assert.equal(
    checkPermission(["products.read"], "products.create"),
    "Танд эрх байхгүй байна.",
  );
});

test("checkPermission returns error for empty permissions", () => {
  assert.equal(
    checkPermission([], "products.create"),
    "Танд эрх байхгүй байна.",
  );
});

test("checkPermission is case-sensitive", () => {
  assert.equal(
    checkPermission(
      ["Products.Create" as "products.create"],
      "products.create",
    ),
    "Танд эрх байхгүй байна.",
  );
});

// ─── escapeHtml ───────────────────────────────────────────────────────

test("escapeHtml escapes & to &amp;", () => {
  assert.equal(escapeHtml("a & b"), "a &amp; b");
});

test("escapeHtml escapes < to &lt;", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});

test("escapeHtml escapes > to &gt;", () => {
  assert.equal(escapeHtml("1 > 2"), "1 &gt; 2");
});

test("escapeHtml escapes double quotes to &quot;", () => {
  assert.equal(escapeHtml('say "hello"'), "say &quot;hello&quot;");
});

test("escapeHtml escapes single quotes to &#39;", () => {
  assert.equal(escapeHtml("it's"), "it&#39;s");
});

test("escapeHtml handles all special characters together", () => {
  assert.equal(
    escapeHtml('<script>alert("xss")</script>'),
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
  );
});

test("escapeHtml returns empty string for empty input", () => {
  assert.equal(escapeHtml(""), "");
});

test("escapeHtml returns plain string unchanged if no special chars", () => {
  assert.equal(escapeHtml("Hello World"), "Hello World");
});

test("escapeHtml handles Mongolian text", () => {
  assert.equal(escapeHtml("Тест нэр"), "Тест нэр");
});
