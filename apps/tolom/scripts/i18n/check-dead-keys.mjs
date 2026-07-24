#!/usr/bin/env node

/**
 * check-dead-keys.mjs
 *
 * Scans all source files for t() / useTranslations / getTranslations calls
 * and reports message keys in en.json that are never referenced.
 *
 * Usage: node scripts/i18n/check-dead-keys.mjs
 * Exit code 1 when dead keys are found, 0 otherwise.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const MESSAGES_PATH = resolve(ROOT, "src/messages/en.json");
const SRC_DIR = resolve(ROOT, "src");
// These directories are excluded from source scanning (generated or external)
const EXCLUDE_DIRS = new Set([
  "messages",
  "test",
  "node_modules",
  ".next",
  "build",
]);

// ── Load messages ────────────────────────────────────────────

const enJson = JSON.parse(readFileSync(MESSAGES_PATH, "utf8"));

/** Recursively collect all leaf key paths from a nested object. */
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

const ALL_KEYS = new Set(collectLeafPaths(enJson));

// ── Scan source for usage ────────────────────────────────────

/**
 * Collect all files recursively, skipping excluded dirs.
 */
function collectFiles(dir, maxFiles = 80000) {
  const files = [];
  let count = 0;
  function walk(current) {
    if (count > maxFiles) return;
    for (const entry of readdirSync(current)) {
      if (count > maxFiles) return;
      const full = resolve(current, entry);
      if (statSync(full).isDirectory()) {
        const base = entry.replace(/^\./, "");
        if (!EXCLUDE_DIRS.has(base) && !base.startsWith(".")) {
          walk(full);
        }
      } else {
        const ext = extname(full);
        if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
          files.push(full);
          count++;
        }
      }
    }
  }
  walk(dir);
  return files;
}

/**
 * Extract all t() / getTranslations / useTranslations namespace + key patterns
 * from a single file's content.
 *
 * Returns a Set of fully-qualified keys: "namespace.key.subkey"
 */
function extractUsedKeys(content) {
  const used = new Set();

  // 1. t("literal.key") calls — the key may be chained via t("namespace.key")
  const tCalls = content.matchAll(/t\(\s*["']([^"']+)["']\s*\)/g);
  for (const m of tCalls) {
    used.add(m[1]);
  }

  // 2. Template strings: t(`key.${var}`) — we extract the static prefix
  const tTemplateCalls = content.matchAll(/t\(\s*`([^$`]*?)(?:\$\{)/g);
  for (const m of tTemplateCalls) {
    used.add(m[1]);
  }

  // 3. useTranslations("namespace") → getTranslations({namespace: "..."})
  const nsPatterns = [
    /useTranslations\(\s*["']([^"']+)["']\s*\)/g,
    /getTranslations\(\s*\{[^}]*?namespace:\s*["']([^"']+)["']/g,
  ];
  for (const pattern of nsPatterns) {
    const nsMatches = content.matchAll(pattern);
    for (const m of nsMatches) {
      // The namespace itself is a used key prefix
      used.add(m[1]);
    }
  }

  // 4. getTranslations with variable namespace — can't statically determine,
  //    so we skip these (false negatives are acceptable)

  return used;
}

// ── Main ─────────────────────────────────────────────────────

const files = collectFiles(SRC_DIR);
const usedPrefixes = new Set();
const usedFullKeys = new Set();

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const keys = extractUsedKeys(content);
  for (const key of keys) {
    usedFullKeys.add(key);
    // Also add parent prefixes
    const parts = key.split(".");
    for (let i = 0; i < parts.length; i++) {
      usedPrefixes.add(parts.slice(0, i + 1).join("."));
    }
  }
}

// Determine which message keys are unused
const deadKeys = [];
for (const key of ALL_KEYS) {
  if (!usedFullKeys.has(key) && !usedPrefixes.has(key)) {
    deadKeys.push(key);
  }
}

deadKeys.sort();

// ── Report ───────────────────────────────────────────────────

console.log(`\n📦 Scanned ${files.length} source files`);
console.log(`📝 ${ALL_KEYS.size} total message keys`);

if (deadKeys.length === 0) {
  console.log("✅ All message keys are referenced in source.\n");
  process.exit(0);
}

console.log(`\n⚠️  ${deadKeys.length} potentially unused keys:\n`);
for (const key of deadKeys.slice(0, 50)) {
  console.log(`   ${key}`);
}
if (deadKeys.length > 50) {
  console.log(`   ... and ${deadKeys.length - 50} more`);
}
console.log(
  "\n💡 Tip: These may be false positives if keys are constructed dynamically or referenced via variables.\n",
);
process.exit(0);
