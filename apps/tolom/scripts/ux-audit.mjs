#!/usr/bin/env node
/**
 * UX Laws Audit Script
 * Scans TSX files for common UX law violations.
 *
 * Usage:
 *   node scripts/ux-audit.mjs                    # Scan all src/
 *   node scripts/ux-audit.mjs src/components/    # Scan specific dir
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

// ── Config ──
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "generated",
]);

const args = process.argv.slice(2);
const scanRoot = args[0] || "src";

// ── Helpers ──
const findings = [];
let filesScanned = 0;

function add(severity, file, line, law, description) {
  findings.push({ severity, file, line, law, description });
}

function scanFile(filePath) {
  const rel = relative(process.cwd(), filePath);
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }
  filesScanned++;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // ── 1. Fitts's Law: Small touch targets ──
    // Icon-only buttons without aria-label
    if (
      /<(?:Button|button)[^>]*>/.test(line) &&
      /<Icon|className="size-[234]"/.test(line) &&
      !/aria-label|aria-labelledby|title/.test(line) &&
      !/children/.test(line)
    ) {
      add("WARN", rel, lineNum, "Fitts", "Icon-only button without aria-label");
    }

    // Very small explicit sizes on buttons
    if (
      /<(?:Button|button)/.test(line) &&
      /size-(xs|3)\b/.test(line)
    ) {
      add("WARN", rel, lineNum, "Fitts", "Button with very small size (xs/3) — minimum 44pt recommended");
    }

    // ── 2. Hick's Law: Too many choices ──
    // Count buttons in file (rough heuristic)
    const buttonCount = (content.match(/<(?:Button|button)[\s>]/g) || []).length;
    if (buttonCount > 6 && i === 0) {
      add(
        "WARN",
        rel,
        1,
        "Hick",
        `${buttonCount} buttons found — consider grouping or progressive disclosure (≤6 recommended)`
      );
    }

    // ── 3. Miller's Law: Too many visible items ──
    // Tables with many columns
    const thCount = (content.match(/<(?:th|TableHead|TableHeader)[\s>]/gi) || []).length;
    if (thCount > 7 && i === 0) {
      add(
        "WARN",
        rel,
        1,
        "Miller",
        `${thCount} table columns — consider hiding less important ones (≤7 recommended)`
      );
    }

    // Lists rendering many items without pagination
    if (
      /\.map\(/.test(line) &&
      !/paginate|page|limit|chunk|slice|virtual|infinite/i.test(content.slice(Math.max(0, content.indexOf(line) - 200), content.indexOf(line)))
    ) {
      // Only flag if the map is rendering a large dataset indicator
      if (/data|items|rows|records|list|entries/i.test(line)) {
        add(
          "INFO",
          rel,
          lineNum,
          "Miller",
          "List rendering — verify pagination or virtualization for large datasets"
        );
      }
    }

    // ── 4. Error Prevention ──
    // Forms without validation
    if (/<form[\s>]/i.test(line)) {
      const formContext = content.slice(
        Math.max(0, content.indexOf(line) - 100),
        Math.min(content.length, content.indexOf(line) + 500)
      );
      const hasValidation =
        /zod|validate|validation|react-hook-form|useForm|onSubmit.*valid|schema/i.test(
          formContext
        );
      if (!hasValidation) {
        add(
          "WARN",
          rel,
          lineNum,
          "Error Prevention",
          "Form without visible validation — add zod, react-hook-form, or inline validation"
        );
      }
    }

    // Destructive actions without confirmation
    if (
      /delete|remove|archive|destroy|drop/i.test(line) &&
      /onClick|onPress|handler/i.test(line)
    ) {
      const context = content.slice(
        Math.max(0, content.indexOf(line) - 100),
        Math.min(content.length, content.indexOf(line) + 200)
      );
      const hasConfirm =
        /confirm\(|window\.confirm|Dialog|AlertDialog|Modal.*confirm/i.test(context);
      if (!hasConfirm) {
        add(
          "WARN",
          rel,
          lineNum,
          "Error Prevention",
          "Destructive action without confirmation — add confirm dialog or undo toast"
        );
      }
    }

    // ── 5. Visibility of System Status ──
    // Async operations without loading state
    if (
      /useMutation|mutateAsync|fetch\(|\.insert\(|\.update\(|\.delete\(/.test(line)
    ) {
      const surrounding = content.slice(
        Math.max(0, content.indexOf(line) - 300),
        Math.min(content.length, content.indexOf(line) + 300)
      );
      const hasLoading =
        /isLoading|isPending|loading|setLoading|isSubmitting/i.test(surrounding);
      if (!hasLoading) {
        add(
          "WARN",
          rel,
          lineNum,
          "Visibility of Status",
          "Async operation without loading state — add isLoading/isPending indicator"
        );
      }
    }

    // onClick with async without loading feedback
    if (/onClick.*async|onClick=\{.*async/.test(line)) {
      const surrounding = content.slice(
        Math.max(0, content.indexOf(line) - 200),
        Math.min(content.length, content.indexOf(line) + 200)
      );
      const hasLoading = /loading|pending|spinner|disabled.*loading/i.test(surrounding);
      if (!hasLoading) {
        add(
          "INFO",
          rel,
          lineNum,
          "Visibility of Status",
          "Async onClick without loading feedback — consider disabling button during async"
        );
      }
    }

    // ── 6. Accessibility (basic) ──
    // Images without alt
    if (/<img[\s]/.test(line) && !/alt[=\s]/.test(line)) {
      add("ERROR", rel, lineNum, "Accessibility", "Image without alt attribute");
    }

    // Inputs without labels
    if (/<input[\s]/.test(line) && !/aria-label|aria-labelledby|id=/.test(line)) {
      add("ERROR", rel, lineNum, "Accessibility", "Input without label (aria-label, aria-labelledby, or associated <label>)");
    }

    // onClick on non-interactive elements without role
    if (
      /<(?:div|span|p|li|td|tr)[^>]*onClick/.test(line) &&
      !/role=|tabIndex|tabindex/.test(line)
    ) {
      add(
        "ERROR",
        rel,
        lineNum,
        "Accessibility",
        "onClick on non-interactive element without role='button' and tabIndex"
      );
    }

    // Missing key in map
    if (/\.map\(/.test(line)) {
      // Look ahead for key prop in the next 5 lines
      const mapBlock = lines.slice(i, i + 5).join("\n");
      if (/>=.*map\(/.test(line) && !/key[=\s{]/.test(mapBlock)) {
        add("WARN", rel, lineNum, "Accessibility", "Map render may be missing key prop");
      }
    }
  }

  // ── 7. Peak-End: Success/confirmation screens ──
  if (/success|confirm|complete|done|finish/i.test(filePath)) {
    add(
      "INFO",
      rel,
      1,
      "Peak-End",
      "Success/confirmation screen — verify it feels polished (Peak-End Rule)"
    );
  }

  // ── 8. Gestalt Proximity: Uniform spacing ──
  const gapValues = content.match(/gap-\d+/g) || [];
  if (gapValues.length > 5) {
    const uniqueGaps = [...new Set(gapValues)];
    if (uniqueGaps.length === 1) {
      add(
        "INFO",
        rel,
        1,
        "Gestalt Proximity",
        `Uniform ${uniqueGaps[0]} gap everywhere — differentiate spacing between related vs unrelated items`
      );
    }
  }
}

// ── Walk directory ──
function walkDir(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (extname(entry) === ".tsx" || extname(entry) === ".jsx") {
        scanFile(fullPath);
      }
    } catch {
      // skip inaccessible files
    }
  }
}

// ── Main ──
walkDir(scanRoot);

// ── Output ──
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const severityColor = {
  ERROR: RED,
  WARN: YELLOW,
  INFO: BLUE,
};

// Sort by severity then file
const sorted = findings.sort((a, b) => {
  const sevOrder = { ERROR: 0, WARN: 1, INFO: 2 };
  return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3) || a.file.localeCompare(b.file);
});

for (const f of sorted) {
  const color = severityColor[f.severity] || RESET;
  console.log(
    `${color}[${f.severity}]${RESET} ${BOLD}${f.file}:${f.line}${RESET} — ${f.law} — ${f.description}`
  );
}

// Summary
const errors = findings.filter((f) => f.severity === "ERROR").length;
const warnings = findings.filter((f) => f.severity === "WARN").length;
const infos = findings.filter((f) => f.severity === "INFO").length;

console.log(`\n${BOLD}--- UX Audit Summary ---${RESET}`);
console.log(`Files scanned: ${filesScanned}`);
console.log(`${RED}Errors: ${errors}${RESET}`);
console.log(`${YELLOW}Warnings: ${warnings}${RESET}`);
console.log(`${BLUE}Info: ${infos}${RESET}`);
console.log(
  `\nFor law details → ${BOLD}docs/ux-laws-reference.md${RESET}`
);
