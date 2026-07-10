#!/usr/bin/env node
/**
 * design-slop-check.mjs — Detects common AI design anti-patterns in TSX/TS files.
 * Part of TOLOM's 3-layer design quality enforcement system.
 *
 * Usage: node scripts/design-slop-check.mjs [dir]
 * Exit code 1 if violations found.
 *
 * Checks:
 *   1. Raw color values in className (hex, rgb, oklch not in CSS files)
 *   2. space-y / space-x usage (should use gap with flex)
 *   3. Oversized border-radius (rounded-2xl, rounded-3xl, rounded-[XX])
 *   4. Shadow on card-like elements (shadow-* with bg-card)
 *   5. Gradient text patterns
 *   6. ease-in on UI elements
 *   7. Transition: all
 *   8. scale(0) entry animations
 *   9. Emoji as structural icons
 *  10. Warm cream background patterns
 */

import { globSync, readFileSync } from "node:fs";

const ROOT = process.argv[2] || "src";
let errors = 0;
let warnings = 0;

const EXEMPT = (f) =>
  f.includes("node_modules") ||
  f.includes(".next") ||
  f.includes("/__tests__/") ||
  f.includes("/test/") ||
  f.includes(".test.") ||
  f.includes(".spec.") ||
  f.includes("globals.css") ||
  f.includes("tailwind") ||
  f.includes("postcss");

const files = globSync(`${ROOT}/**/*.{tsx,ts}`, {
  ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/test/**"],
});

/**
 * Each rule: { pattern, message, severity: 'error' | 'warn', context? }
 * context(line) returns true if the rule should fire on this line
 */
const rules = [
  // ── Colors ──
  {
    name: "raw-hex-color",
    pattern:
      /\b(bg|text|border|ring|shadow|from|to|via)-\[[#]?[0-9a-fA-F]{3,8}\]/,
    message:
      "Raw hex color in className — use semantic tokens (bg-primary, text-destructive, etc.)",
    severity: "error",
  },
  {
    name: "raw-oklch-in-tsx",
    pattern: /\b(bg|text|border|ring)-\[oklch\(/,
    message:
      "Raw OKLCH value in className — use Tailwind semantic token classes instead",
    severity: "error",
  },
  {
    name: "warm-cream-bg",
    pattern:
      /\b(bg|from|to|via)-\[(#F4F1EA|#f4f1ea|#FAF7F2|#faf7f2|#F5F0E8|#f5f0e8)\]/,
    message:
      "Warm cream background detected — this is the AI default of 2026. Use bg-background (pure white).",
    severity: "error",
  },

  // ── Spacing ──
  {
    name: "space-y",
    pattern: /\bspace-y-\d/,
    message: "space-y-* detected — use gap-* with flex instead",
    severity: "error",
  },
  {
    name: "space-x",
    pattern: /\bspace-x-\d/,
    message: "space-x-* detected — use gap-* with flex instead",
    severity: "error",
  },

  // ── Border Radius ──
  {
    name: "oversized-radius",
    pattern: /\brounded-(2xl|3xl|4xl)\b/,
    message:
      "Oversized border-radius (rounded-2xl/3xl) on non-badge elements — cards max at rounded-xl, buttons at rounded-lg",
    severity: "warn",
    context: (line) =>
      !/\b(badge|chip|pill|avatar|dot|status|tag)\b/i.test(line),
  },
  {
    name: "arbitrary-radius-large",
    pattern: /\brounded-\[(\d{2,})px\]/,
    message:
      "Large arbitrary border-radius — check if this exceeds the 14px card max",
    severity: "warn",
    context: (line) => {
      const match = line.match(/rounded-\[(\d+)px\]/);
      return match && parseInt(match[1]) > 14;
    },
  },

  // ── Elevation ──
  {
    name: "shadow-on-card",
    pattern: /\bshadow-\w+.*\bbg-card/,
    message:
      "Shadow on card element — cards use ring-1 ring-foreground/10, not shadows",
    severity: "error",
    context: (line) => {
      // Exclude shadow-none (explicitly no shadow)
      if (/\bshadow-none\b/.test(line)) return false;
      // Exclude floating overlays (fixed positioning, high z-index)
      if (/\bfixed\b.*\bz-\[/.test(line) || /\bz-\[1[0-9]{2}\]/.test(line))
        return false;
      // Exclude drag previews and overlays
      if (/DragOverlay|drag.*preview|preview.*drag/i.test(line)) return false;
      return true;
    },
  },
  {
    name: "card-with-shadow",
    pattern: /\bbg-card.*\bshadow-\w+/,
    message:
      "Card with shadow — cards use ring-1 ring-foreground/10, not shadows",
    severity: "error",
    context: (line) => {
      if (/\bshadow-none\b/.test(line)) return false;
      if (/\bfixed\b.*\bz-\[/.test(line) || /\bz-\[1[0-9]{2}\]/.test(line))
        return false;
      if (/DragOverlay|drag.*preview|preview.*drag/i.test(line)) return false;
      return true;
    },
  },
  {
    name: "border-plus-shadow",
    pattern: /\bborder\b.*\bshadow-\w+/, // rough match, catches the combo
    message:
      "border + box-shadow combo detected (ghost-card pattern) — pick one, not both",
    severity: "warn",
  },

  // ── Typography ──
  {
    name: "serif-font",
    pattern:
      /\bfont-(serif|playfair|lora|merriweather|libre|crimson|source-serif|old-standard|dm-serif|pt-serif|cormorant)\b/,
    message:
      "Serif font detected — TOLOM uses SF Pro Display (sans-serif) exclusively",
    severity: "error",
  },
  {
    name: "gradient-text",
    pattern:
      /\b(bg-clip-text|text-transparent.*bg-gradient|background-clip:\s*text)/,
    message:
      "Gradient text detected — use solid color; emphasis via weight or size",
    severity: "error",
  },

  // ── Animation ──
  {
    name: "transition-all",
    pattern: /\btransition:\s*all\b/,
    message: "transition: all — specify exact properties (transform, opacity)",
    severity: "error",
  },
  {
    name: "ease-in-on-ui",
    pattern: /\bease-in\b(?!\s*-\s*(expo|quart))/,
    message:
      "ease-in on UI element — use ease-out-quart for entry, ease-in-expo for exit",
    severity: "warn",
    context: (line) => !/keyframes|@keyframes/.test(line),
  },
  {
    name: "scale-zero-entry",
    pattern: /\bscale\(0\)/,
    message:
      "scale(0) entry animation — start from scale(0.95) with opacity: 0",
    severity: "error",
  },
  {
    name: "animate-width-height",
    pattern: /\b(transition|animate).*\b(width|height|top|left|bottom|right)\b/,
    message:
      "Animating layout properties (width/height/top/left) — use transform and opacity only",
    severity: "warn",
  },

  // ── Patterns ──
  {
    name: "emoji-icon",
    pattern: /[\u{1F300}-\u{1F9FF}]/u,
    message:
      "Emoji detected in TSX — use SVG icons (Lucide, Heroicons) instead",
    severity: "warn",
    context: (line) =>
      !/alt=|aria-label|title=|placeholder|messages\//.test(line) && // exempt in strings
      /className|<[A-Z]/.test(line), // only in JSX context
  },
  {
    name: "glassmorphism",
    pattern: /\bbackdrop-blur\b.*\bbg-\w+\/\d+/,
    message:
      "Glassmorphism pattern (blur + translucent bg) — use solid bg-card + ring-1",
    severity: "warn",
  },
  {
    name: "side-stripe",
    pattern: /\bborder-l-[2-9]|\bborder-l-\[\d/,
    message:
      "Side-stripe border detected (border-l > 1px) — use ring-1 or background tint",
    severity: "error",
  },
];

// ── Run checks ──

for (const file of files) {
  if (EXEMPT(file)) continue;
  const lines = readFileSync(file, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const L = i + 1;

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        // Check context filter if present
        if (rule.context && !rule.context(line)) continue;

        const prefix = rule.severity === "error" ? "❌" : "⚠️";
        console.error(
          `${prefix} ${file}:${L} — [${rule.name}] ${rule.message}`,
        );

        if (rule.severity === "error") errors++;
        else warnings++;
      }
    }
  }
}

// ── Summary ──

console.log("");
if (errors > 0 || warnings > 0) {
  console.log(
    `Found ${errors} error(s) and ${warnings} warning(s) in design quality checks.`,
  );
  if (errors > 0) {
    console.log(
      "Errors must be fixed before committing. See DESIGN_SYSTEM.md for alternatives.",
    );
    process.exit(1);
  }
  console.log("Warnings should be reviewed but do not block CI.");
} else {
  console.log("✅ No design anti-patterns detected.");
}
