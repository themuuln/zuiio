import assert from "node:assert/strict";
import test from "node:test";
import {
  escapeHtml,
  flattenFieldErrors,
  getString,
  normalizePhone,
  requireEmail,
  requirePassword,
  sanitizeRedirectPath,
} from "@zuiio/core";

// ─── requireEmail ──────────────────────────────────────────────────

test("requireEmail accepts valid email", () => {
  assert.equal(requireEmail("user@example.com"), true);
  assert.equal(requireEmail("admin@company.mn"), true);
});

test("requireEmail rejects invalid email", () => {
  assert.equal(requireEmail(""), false);
  assert.equal(requireEmail("not-an-email"), false);
  assert.equal(requireEmail("@missing-local.com"), false);
  assert.equal(requireEmail("no-domain@"), false);
});

// ─── requirePassword ───────────────────────────────────────────────

test("requirePassword accepts 8+ characters", () => {
  assert.equal(requirePassword("12345678"), true);
  assert.equal(requirePassword("longpassword"), true);
});

test("requirePassword rejects short passwords", () => {
  assert.equal(requirePassword(""), false);
  assert.equal(requirePassword("1234567"), false);
  assert.equal(requirePassword("short"), false);
});

// ─── getString ─────────────────────────────────────────────────────

test("getString extracts and trims form value", () => {
  const fd = new FormData();
  fd.set("name", "  Тэмцэл  ");
  assert.equal(getString(fd, "name"), "Тэмцэл");
});

test("getString returns empty string for missing key", () => {
  const fd = new FormData();
  assert.equal(getString(fd, "missing"), "");
});

test("getString returns empty string for non-string value", () => {
  const fd = new FormData();
  fd.set("file", new Blob(), "photo.jpg");
  assert.equal(getString(fd, "file"), "");
});

// ─── normalizePhone ────────────────────────────────────────────────

test("normalizePhone strips spaces and dashes", () => {
  assert.equal(normalizePhone("9911 2233"), "99112233");
  assert.equal(normalizePhone("9911-2233"), "99112233");
  assert.equal(normalizePhone("99112233"), "99112233");
});

// ─── sanitizeRedirectPath ──────────────────────────────────────────

test("sanitizeRedirectPath keeps safe internal paths", () => {
  assert.equal(sanitizeRedirectPath("/dashboard"), "/dashboard");
  assert.equal(sanitizeRedirectPath("/sales/new"), "/sales/new");
  assert.equal(sanitizeRedirectPath("/"), "/");
});

test("sanitizeRedirectPath blocks external URLs", () => {
  assert.equal(sanitizeRedirectPath("https://evil.com"), "/");
  assert.equal(sanitizeRedirectPath("//evil.com"), "/");
  assert.equal(sanitizeRedirectPath("javascript:void(0)"), "/");
});

test("sanitizeRedirectPath handles empty and non-string input", () => {
  assert.equal(sanitizeRedirectPath(""), "/");
  assert.equal(sanitizeRedirectPath(null as unknown as string), "/");
  assert.equal(sanitizeRedirectPath(undefined as unknown as string), "/");
});

// ─── escapeHtml ────────────────────────────────────────────────────

test("escapeHtml escapes special characters", () => {
  assert.equal(
    escapeHtml('<script>alert("xss")</script>'),
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
  );
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml("it's"), "it&#39;s");
});

test("escapeHtml passes through safe strings unchanged", () => {
  assert.equal(escapeHtml("hello world"), "hello world");
  assert.equal(escapeHtml("Тэмцэл 123"), "Тэмцэл 123");
});

// ─── flattenFieldErrors ────────────────────────────────────────────

test("flattenFieldErrors takes the first error per field", () => {
  const issues = [
    { path: ["email"], message: "Required" },
    { path: ["email"], message: "Must be valid" },
    { path: ["name"], message: "Too short" },
  ];
  const result = flattenFieldErrors(issues);
  assert.deepEqual(result, {
    email: "Required",
    name: "Too short",
  });
});

test("flattenFieldErrors returns empty object for no issues", () => {
  assert.deepEqual(flattenFieldErrors([]), {});
});

test("flattenFieldErrors ignores issues with empty path", () => {
  const issues = [
    { path: [], message: "Root error" },
    { path: ["field"], message: "Field error" },
  ];
  const result = flattenFieldErrors(issues);
  assert.deepEqual(result, { field: "Field error" });
});
