#!/usr/bin/env node
/**
 * radius-check.mjs — Enforces border radius hierarchy.
 * Detects card-like containers using `rounded-lg` instead of `rounded-xl`.
 * Usage: node scripts/radius-check.mjs [dir]
 * Exit code 1 if violations found.
 *
 * Rules enforced:
 *   - Card-level containers (bg-card + p-3+ padding) MUST use rounded-xl
 *   - Buttons, inputs, toolbar chips, segmented controls: rounded-lg is correct
 *   - See AGENTS.md → "Border Radius Hierarchy" for the full reference
 */

import { globSync, readFileSync } from "node:fs";

const ROOT = process.argv[2] || "src";
let errors = 0;

const files = globSync(`${ROOT}/**/*.{tsx,ts}`, {
  ignore: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/__tests__/**",
    "**/*.test.*",
    "**/*.spec.*",
    "**/*.d.ts",
  ],
});

/**
 * A card container is flagged when:
 * 1. className contains `rounded-lg`
 * 2. className contains `bg-card` (or `bg-card/40`, `bg-card/50`, etc.)
 * 3. Padding suggests a card container (p-3+ or equivalent), not a toolbar chip
 * 4. Element is NOT a button/input/select (those use rounded-lg intentionally)
 * 5. Element is NOT a segmented control (p-0.5, gap-px pattern)
 * 6. Element is NOT inside a multi-line button/Button element
 */
function isCardContainer(line, lines, lineIndex) {
  const hasRoundedLg = /\brounded-lg\b/.test(line);
  if (!hasRoundedLg) return false;

  const hasBgCard = /\bbg-card(?:\/\d+)?\b/.test(line);
  if (!hasBgCard) return false;

  // Exclude toolbars/chips: h-8, h-9, h-10 suggest fixed-height toolbar items
  if (/\bh-[5-9]\b|\bh-10\b/.test(line) && !/\bp-[3-9]\b/.test(line)) {
    return false;
  }

  // Exclude items with only small padding (p-1, p-2 — these are inline/toolbar items)
  if (/\bp-1\b/.test(line) || /\bp-2\b/.test(line)) return false;
  if (/\bpx-[12]\b/.test(line) || /\bpy-[12]\b/.test(line)) return false;

  // Exclude segmented controls (gap-px, p-0.5 pattern)
  if (/\bgap-px\b/.test(line) || /\bp-0\.5\b/.test(line)) return false;

  // Exclude explicit button/input elements on the same line
  if (/<(Button|button|input|select|textarea)\b/.test(line)) return false;

  // Multi-line detection: check previous 5 lines for an opening button/input tag
  const start = Math.max(0, lineIndex - 5);
  const contextBefore = lines.slice(start, lineIndex).join("\n");
  if (/<(Button|button)\b/.test(contextBefore)) return false;

  // Must have container-level padding (p-3+)
  const hasCardPadding =
    /\bp-[3-9]\b/.test(line) ||
    /\bp-1[0-6]\b/.test(line) ||
    /\bpx-[3-9]\b.*\bpy-[3-9]\b/.test(line) ||
    /\bpy-[3-9]\b.*\bpx-[3-9]\b/.test(line);

  return hasCardPadding;
}

for (const file of files) {
  const lines = readFileSync(file, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const L = i + 1;

    if (isCardContainer(line, lines, i)) {
      console.error(
        `❌ ${file}:${L} — card-like container with \`rounded-lg\` should use \`rounded-xl\` (see AGENTS.md: Border Radius Hierarchy)`,
      );
      console.error(`   ${line.trim()}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(
    `\n📋 ${errors} violation(s). Use \`rounded-xl\` for card-level containers, \`rounded-lg\` for buttons/inputs.\n`,
  );
  process.exit(1);
}
