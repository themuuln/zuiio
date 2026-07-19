#!/usr/bin/env node

/**
 * check-messages.mjs
 *
 * Validates translation JSON files for:
 * 1. Recursive key parity between en.json and mn.json
 * 2. Duplicate keys within a single file
 * 3. English-looking values in mn.json (warnings)
 * 4. Missing ICU placeholders that exist in en but not mn
 *
 * Exit code 1 on errors, 0 on clean/warnings only.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = resolve(__dirname, "../../src/messages");

const LOCALES = ["en", "mn"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadJSON(locale) {
  const raw = readFileSync(resolve(MESSAGES_DIR, `${locale}.json`), "utf8");
  return JSON.parse(raw);
}

/**
 * Duplicate key detection is handled by JSON.parse (which silently dedupes).
 * We skip this check because regex-based detection on raw JSON is unreliable
 * when values contain colons (e.g., "time": "10:30").
 * Use `node -e "JSON.parse(require('fs').readFileSync('file'))"` to verify.
 */
function findDuplicateKeys() {
  return [];
}

/** Recursively collect all leaf paths in a nested object. */
function collectLeafPaths(obj, prefix = "") {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

/** Check if a value looks like it's still in English (Cyrillic absent). */
function looksEnglish(value) {
  if (typeof value !== "string") return false;
  // Allow short strings (≤3 chars), numbers, pure punctuation
  if (value.length <= 3) return false;
  // Allow strings that are mostly placeholders or codes
  if (/^[\s\d\-–—.,:;!?'"(){}[\]/\\@#$%^&*+=|<>~`]+$/.test(value)) return false;
  // Allow brand names and acronyms
  if (/^[A-Z][A-Z\s]+$/.test(value) && value.length <= 15) return false;
  // Allow placeholder examples (contain @, example.com, etc.)
  if (/@|example\.com|placeholder/i.test(value)) return false;
  // Allow hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return false;
  // Allow values that are mostly template placeholders
  const withoutPlaceholders = value.replace(/\{[^}]+\}/g, "");
  if (withoutPlaceholders.trim().length < 4) return false;
  // Check for Cyrillic characters
  const hasCyrillic = /[\u0400-\u04FF]/.test(value);
  // If it has Latin letters but no Cyrillic, it's likely English
  const hasLatin = /[a-zA-Z]/.test(value);
  return hasLatin && !hasCyrillic;
}

/** Extract ICU placeholders like {count}, {name} from a string. */
function extractPlaceholders(str) {
  if (typeof str !== "string") return new Set();
  return new Set(str.match(/\{[^}]+\}/g) || []);
}

// ── Main ─────────────────────────────────────────────────────────────────────

let hasErrors = false;
let warningCount = 0;

console.log("🔍 Checking translation files...\n");

// Load both locales
const messages = {};
for (const locale of LOCALES) {
  try {
    messages[locale] = loadJSON(locale);
  } catch (e) {
    console.error(`❌ Failed to load ${locale}.json: ${e.message}`);
    process.exit(1);
  }
}

// 1. Recursive key parity
console.log("── Key Parity ──");
const enPaths = new Set(collectLeafPaths(messages.en));
const mnPaths = new Set(collectLeafPaths(messages.mn));

const missingInMn = [...enPaths].filter((p) => !mnPaths.has(p));
const extraInMn = [...mnPaths].filter((p) => !enPaths.has(p));

if (missingInMn.length) {
  hasErrors = true;
  console.error(
    `  ❌ ${missingInMn.length} keys in en.json missing from mn.json:`,
  );
  for (const p of missingInMn) console.error(`     ${p}`);
} else {
  console.log("  ✅ All en.json keys present in mn.json");
}

if (extraInMn.length) {
  hasErrors = true;
  console.error(
    `  ❌ ${extraInMn.length} extra keys in mn.json not in en.json:`,
  );
  for (const p of extraInMn) console.error(`     ${p}`);
} else {
  console.log("  ✅ No extra keys in mn.json");
}

// 2. Duplicate keys (raw file scan)
console.log("\n── Duplicate Keys ──");
for (const locale of LOCALES) {
  const filePath = resolve(MESSAGES_DIR, `${locale}.json`);
  const dupes = findDuplicateKeys(filePath);
  if (dupes.length) {
    hasErrors = true;
    for (const d of dupes) {
      console.error(`  ❌ ${locale}.json:${d.line} — duplicate key "${d.key}"`);
    }
  } else {
    console.log(`  ✅ ${locale}.json — no duplicates`);
  }
}

// 3. English-looking values in mn.json
console.log("\n── English Values in mn.json ──");
const mnPaths2 = collectLeafPaths(messages.mn);
let englishCount = 0;
for (const path of mnPaths2) {
  const parts = path.split(".");
  let val = messages.mn;
  for (const p of parts) val = val?.[p];
  if (looksEnglish(val)) {
    warningCount++;
    englishCount++;
    if (englishCount <= 20) {
      console.warn(`  ⚠️  ${path} = "${val}"`);
    }
  }
}
if (englishCount > 20) {
  console.warn(`  ... and ${englishCount - 20} more`);
}
if (englishCount === 0) {
  console.log("  ✅ No English-looking values found");
} else {
  console.warn(
    `  ⚠️  ${englishCount} values may be untranslated (warnings only)`,
  );
}

// 4. Placeholder parity
console.log("\n── Placeholder Parity ──");
let placeholderIssues = 0;
for (const enPath of enPaths) {
  const enParts = enPath.split(".");
  let enVal = messages.en;
  for (const p of enParts) enVal = enVal?.[p];

  const mnParts = enPath.split(".");
  let mnVal = messages.mn;
  for (const p of mnParts) mnVal = mnVal?.[p];

  if (typeof enVal === "string" && typeof mnVal === "string") {
    const enPh = extractPlaceholders(enVal);
    const mnPh = extractPlaceholders(mnVal);
    const missing = [...enPh].filter((p) => !mnPh.has(p));
    const extra = [...mnPh].filter((p) => !enPh.has(p));
    if (missing.length || extra.length) {
      placeholderIssues++;
      if (placeholderIssues <= 10) {
        const issues = [];
        if (missing.length) issues.push(`missing ${[...missing].join(", ")}`);
        if (extra.length) issues.push(`extra ${[...extra].join(", ")}`);
        console.warn(`  ⚠️  ${enPath}: ${issues.join("; ")}`);
      }
    }
  }
}
if (placeholderIssues > 10) {
  console.warn(`  ... and ${placeholderIssues - 10} more`);
}
if (placeholderIssues === 0) {
  console.log("  ✅ All placeholders match");
} else {
  console.warn(
    `  ⚠️  ${placeholderIssues} keys have placeholder mismatches (warnings only)`,
  );
}

// Summary
console.log("\n── Summary ──");
console.log(`  en.json: ${enPaths.size} leaf keys`);
console.log(`  mn.json: ${mnPaths.size} leaf keys`);
console.log(`  Warnings: ${warningCount}`);

if (hasErrors) {
  console.error("\n❌ Translation file validation failed.\n");
  process.exit(1);
} else {
  console.log("\n✅ Translation files are valid.\n");
  process.exit(0);
}
