#!/usr/bin/env node
/**
 * capture-check.mjs — Enforces capture() over console.error in catch blocks.
 * Usage: node scripts/capture-check.mjs [dir]
 * Exit code 1 if violations found.
 */

import { globSync, readFileSync } from "node:fs";

const ROOT = process.argv[2] || "src";
let errors = 0;

const EXEMPT = (f) =>
  f.includes("node_modules") ||
  f.includes(".next") ||
  f.includes("/__tests__/");

const files = globSync(`${ROOT}/**/*.{ts,tsx}`, {
  ignore: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/__tests__/**",
  ],
});

// ── Pass 1: Single-line patterns ──

for (const file of files) {
  if (EXEMPT(file)) continue;
  const lines = readFileSync(file, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const L = i + 1;

    const isCatchLine =
      line.includes("catch") && line.includes("console.error");
    const isDotCatch = /.catch\s*\(\s*console\.error/.test(line);
    const isCatchArrow = /.catch\s*\(.*=>\s*\{[^}]*console\.error/.test(line);

    if (isCatchLine || isDotCatch || isCatchArrow) {
      console.error(
        `❌ ${file}:${L} — use capture() instead of console.error in catch blocks`,
      );
      errors++;
    }
  }
}

// ── Pass 2: Multi-line patterns ──

for (const file of files) {
  if (EXEMPT(file)) continue;
  const lines = readFileSync(file, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("console.error")) continue;

    const context = lines.slice(Math.max(0, i - 3), i).join(" ");
    if (/catch\s*\(/.test(context)) {
      console.error(
        `❌ ${file}:${i + 1} — use capture() instead of console.error in catch blocks`,
      );
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(
    `\n📋 ${errors} violation(s). Use capture() from @zuiio/capture instead.\n`,
  );
  process.exit(1);
}
