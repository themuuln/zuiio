import assert from "node:assert/strict";
import test from "node:test";
import {
  renderTemplate,
  getChannelLabel,
  isValidPhone,
  isValidTelegramChatId,
  DEFAULT_TEMPLATES,
} from "@/lib/notifications";

// ─── renderTemplate ─────────────────────────────────────────────────

test("renderTemplate replaces {{variable}} placeholders with values", () => {
  assert.equal(
    renderTemplate("Hello {{customer_name}}!", { customer_name: "Bat" }),
    "Hello Bat!",
  );
});

test("renderTemplate keeps unknown placeholders unchanged", () => {
  assert.equal(
    renderTemplate("Hello {{unknown_var}}, welcome!", {}),
    "Hello {{unknown_var}}, welcome!",
  );
});

test("renderTemplate handles empty variables object", () => {
  assert.equal(
    renderTemplate("No placeholders here", {}),
    "No placeholders here",
  );
});

test("renderTemplate replaces multiple variables in one call", () => {
  const result = renderTemplate(
    "{{customer_name}} bought {{sale_total}}₮ on {{sale_date}}",
    { customer_name: "Tseren", sale_total: "15000", sale_date: "2025-01-15" },
  );
  assert.equal(result, "Tseren bought 15000₮ on 2025-01-15");
});

// ─── getChannelLabel ────────────────────────────────────────────────

test('getChannelLabel("whatsapp") returns "WhatsApp"', () => {
  assert.equal(getChannelLabel("whatsapp"), "WhatsApp");
});

test('getChannelLabel("telegram") returns "Telegram"', () => {
  assert.equal(getChannelLabel("telegram"), "Telegram");
});

test('getChannelLabel("sms") returns "SMS"', () => {
  assert.equal(getChannelLabel("sms"), "SMS");
});

test("getChannelLabel unknown type returns the input unchanged", () => {
  assert.equal(getChannelLabel("email"), "email");
});

// ─── isValidPhone ───────────────────────────────────────────────────

test("isValidPhone accepts valid phone with + prefix", () => {
  assert.equal(isValidPhone("+97699112233"), true);
});

test("isValidPhone accepts valid phone without prefix", () => {
  assert.equal(isValidPhone("99112233"), true);
});

test("isValidPhone accepts valid phone with spaces and dashes", () => {
  assert.equal(isValidPhone("+976 991 122 33"), true);
  assert.equal(isValidPhone("+976-991-122-33"), true);
});

test("isValidPhone rejects too short phone", () => {
  assert.equal(isValidPhone("1234567"), false);
});

test("isValidPhone rejects too long phone", () => {
  assert.equal(isValidPhone("+1234567890123456"), false);
});

// ─── isValidTelegramChatId ──────────────────────────────────────────

test("isValidTelegramChatId accepts numeric chat ID", () => {
  assert.equal(isValidTelegramChatId("123456789"), true);
});

test("isValidTelegramChatId accepts negative chat ID", () => {
  assert.equal(isValidTelegramChatId("-100123456789"), true);
});

test("isValidTelegramChatId rejects non-numeric value", () => {
  assert.equal(isValidTelegramChatId("abc123"), false);
  assert.equal(isValidTelegramChatId(""), false);
});

// ─── DEFAULT_TEMPLATES ──────────────────────────────────────────────

test("DEFAULT_TEMPLATES has expected channel keys", () => {
  const keys = ["whatsapp", "telegram", "sms"];
  for (const key of keys) {
    assert.ok(key in DEFAULT_TEMPLATES, `missing key: ${key}`);
  }
});

test("DEFAULT_TEMPLATES each key has non-empty template array", () => {
  for (const [key, templates] of Object.entries(DEFAULT_TEMPLATES)) {
    assert.ok(Array.isArray(templates), `${key} is not an array`);
    assert.ok(templates.length > 0, `${key} has empty template array`);
    for (const tpl of templates) {
      assert.ok(tpl.name.length > 0, `${key} template has empty name`);
      assert.ok(tpl.body.length > 0, `${key} template has empty body`);
    }
  }
});
