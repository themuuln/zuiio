import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getVerticalPreset,
  VERTICAL_PRESETS,
  DEFAULT_VERTICAL_CONFIG,
  type VerticalConfig,
} from "@/lib/vertical-config";

function assertPresetShape(preset: VerticalConfig) {
  assert.equal(typeof preset.key, "string");
  assert.ok(preset.key.length > 0, "key must be non-empty");
  assert.equal(typeof preset.displayName, "string");
  assert.ok(preset.displayName.length > 0, "displayName must be non-empty");
  assert.ok(["grid", "barcode", "hybrid"].includes(preset.selectionMode), "selectionMode must be a valid SelectionMode");
  assert.ok(Array.isArray(preset.categoryPreset), "categoryPreset must be an array");
  assert.ok(typeof preset.featureFlags === "object" && preset.featureFlags !== null, "featureFlags must be an object");
  assert.equal(typeof preset.featureFlags.creditLedger, "boolean");
  assert.equal(typeof preset.featureFlags.variants, "boolean");
  assert.equal(typeof preset.featureFlags.eBarimt, "boolean");
  assert.equal(typeof preset.featureFlags.shiftCashCount, "boolean");
  assert.ok(typeof preset.terminology === "object" && preset.terminology !== null, "terminology must be an object");
}

describe("getVerticalPreset", () => {
  test("returns religious-goods preset", () => {
    const p = getVerticalPreset("religious-goods");
    assert.equal(p.key, "religious-goods");
    assert.equal(p.displayName, "Шашны дэлгүүр");
    assert.equal(p.selectionMode, "grid");
    assert.deepEqual(p.categoryPreset, ["Ном", "Эрхи", "Зул", "Санзай", "Хувцас", "Бусад"]);
    assert.equal(p.featureFlags.creditLedger, true);
    assert.equal(p.featureFlags.variants, true);
    assert.equal(p.featureFlags.eBarimt, false);
    assert.equal(p.featureFlags.shiftCashCount, true);
    assert.equal(p.terminology.item, "бараа");
    assert.equal(p.terminology.shop, "дэлгүүр");
  });

  test("returns general-retail preset with barcode mode", () => {
    const p = getVerticalPreset("general-retail");
    assert.equal(p.key, "general-retail");
    assert.equal(p.displayName, "Ерөнхий жижиглэн");
    assert.equal(p.selectionMode, "barcode");
    assert.deepEqual(p.categoryPreset, []);
    assert.equal(p.featureFlags.eBarimt, true);
  });

  test("returns cafe preset with hybrid mode", () => {
    const p = getVerticalPreset("cafe");
    assert.equal(p.key, "cafe");
    assert.equal(p.displayName, "Кафе / Ресторан");
    assert.equal(p.selectionMode, "hybrid");
    assert.deepEqual(p.categoryPreset, ["Хоол", "Ундаа", "Амттан"]);
    assert.equal(p.featureFlags.creditLedger, false);
    assert.equal(p.featureFlags.variants, false);
    assert.equal(p.terminology.item, "хоол");
    assert.equal(p.terminology.shop, "кафе");
  });

  test("returns pharmacy preset", () => {
    const p = getVerticalPreset("pharmacy");
    assert.equal(p.key, "pharmacy");
    assert.equal(p.displayName, "Эмийн сан");
    assert.equal(p.selectionMode, "barcode");
    assert.deepEqual(p.categoryPreset, ["Тариа", "Эм", "Витамин"]);
    assert.equal(p.terminology.item, "эм");
    assert.equal(p.terminology.shop, "эмийн сан");
  });

  test("returns DEFAULT_VERTICAL_CONFIG for an unknown key", () => {
    const p = getVerticalPreset("nonexistent-vertical");
    assert.equal(p, DEFAULT_VERTICAL_CONFIG);
    assert.equal(p.key, "default");
    assert.equal(p.displayName, "Ерөнхий");
    assert.equal(p.selectionMode, "barcode");
  });

  test("returns DEFAULT_VERTICAL_CONFIG for an empty string", () => {
    const p = getVerticalPreset("");
    assert.equal(p, DEFAULT_VERTICAL_CONFIG);
  });
});

describe("DEFAULT_VERTICAL_CONFIG", () => {
  test("has expected shape and values", () => {
    const d = DEFAULT_VERTICAL_CONFIG;
    assert.equal(d.key, "default");
    assert.equal(d.displayName, "Ерөнхий");
    assert.equal(d.selectionMode, "barcode");
    assert.deepEqual(d.categoryPreset, []);
    assert.equal(d.featureFlags.creditLedger, true);
    assert.equal(d.featureFlags.variants, true);
    assert.equal(d.featureFlags.eBarimt, true);
    assert.equal(d.featureFlags.shiftCashCount, true);
    assert.equal(typeof d.terminology, "object");
  });
});

describe("VERTICAL_PRESETS", () => {
  test("contains exactly 4 entries", () => {
    const keys = Object.keys(VERTICAL_PRESETS);
    assert.equal(keys.length, 4);
  });

  test("contains all expected keys", () => {
    assert.ok("religious-goods" in VERTICAL_PRESETS);
    assert.ok("general-retail" in VERTICAL_PRESETS);
    assert.ok("cafe" in VERTICAL_PRESETS);
    assert.ok("pharmacy" in VERTICAL_PRESETS);
  });

  test("every preset has the required fields and correct shape", () => {
    for (const [key, preset] of Object.entries(VERTICAL_PRESETS)) {
      assert.equal(preset.key, key, `preset key "${key}" should match its object key`);
      assertPresetShape(preset);
    }
  });
});
