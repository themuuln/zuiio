import assert from "node:assert/strict";
import test from "node:test";
import type { AppContext } from "@/lib/erp";
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

// ─── requireAppContext user shape ────────────────────────────────────

test("AppContext type has minimal user shape (id + email only)", () => {
  // This validates at compile-time that AppContext['user'] is { id: string; email: unknown }
  // At runtime, requireAppContext() returns user: { id: userId, email: claims.email ?? null }.
  // No consumer should access user.role or user.app_metadata on the narrowed shape.
  const mockUser: AppContext["user"] = {
    id: "test-user-id",
    email: "test@example.com",
  };
  assert.equal(mockUser.id, "test-user-id");
  assert.equal(mockUser.email, "test@example.com");
  // Verify user.role is NOT present on the AppContext['user'] type
  // @ts-expect-error - user.role should not exist on narrowed user shape
  const _roleCheck: undefined = mockUser.role;
  void _roleCheck;
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
