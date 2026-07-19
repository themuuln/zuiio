#!/usr/bin/env node
import { execSync } from "node:child_process";
/**
 * fix-design-slop.mjs — Batch-fixes errors reported by design-slop-check.mjs.
 * Only targets severity: "error" rules.
 */
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "src";

// Re-run the check and parse errors
let raw;
try {
  raw = execSync("node scripts/design-slop-check.mjs 2>&1", {
    encoding: "utf8",
    cwd: ROOT + "/..",
  });
} catch (e) {
  // design-slop-check exits 1 when violations found — that's expected
  raw = e.stdout || "";
}

const errorLines = raw
  .split("\n")
  .filter((l) => l.startsWith("❌"))
  .map((l) => {
    // Format: ❌ src/...:NN — [rule-name] message
    const m = l.match(/^(.+?):(\d+)\s*—\s*\[([^\]]+)\]/);
    if (!m) return null;
    return { file: m[1], line: parseInt(m[2], 10), rule: m[3] };
  })
  .filter(Boolean);

console.log(`Found ${errorLines.length} errors to fix`);

// Group by file
const byFile = new Map();
for (const e of errorLines) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

let totalFixed = 0;

for (const [file, errors] of byFile) {
  const lines = readFileSync(file, "utf8").split("\n");
  let changed = false;

  for (const err of errors) {
    const idx = err.line - 1;
    if (idx < 0 || idx >= lines.length) continue;

    const line = lines[idx];

    if (err.rule === "space-y") {
      // Replace space-y-N with gap-N on the same line
      const newLine = line.replace(/\bspace-y-(\d+)/g, "gap-$1");
      if (newLine !== line) {
        lines[idx] = newLine;
        changed = true;
        totalFixed++;
        console.log(`  FIXED ${file}:${err.line} space-y → gap`);
      }
    } else if (err.rule === "card-with-shadow") {
      // Remove shadow class(es), the element already has bg-card which is fine.
      // Pattern: any shadow-* class (shadow-sm, shadow-md, shadow-lg, shadow-xl, etc.)
      const newLine = line.replace(/\bshadow-(?:sm|md|lg|xl|2xl|none)\b/g, "");
      // Clean up double spaces
      const cleaned = newLine.replace(/\s{2,}/g, " ");
      if (cleaned !== line) {
        lines[idx] = cleaned;
        changed = true;
        totalFixed++;
        console.log(
          `  FIXED ${file}:${err.line} card-with-shadow (removed shadow)`,
        );
      }
    } else if (err.rule === "side-stripe") {
      // Replace border-l-N (>1px) with ring-1
      // Handle both border-l-N and border-l-[Npx] patterns
      const newLine = line
        .replace(/\bborder-l-\[[^\]]+\]/g, "ring-1")
        .replace(/\bborder-l-([2-9])\b/g, "ring-1");
      if (newLine !== line) {
        lines[idx] = newLine;
        changed = true;
        totalFixed++;
        console.log(`  FIXED ${file}:${err.line} side-stripe → ring-1`);
      }
    }
  }

  if (changed) {
    writeFileSync(file, lines.join("\n"));
  }
}

console.log(`\nTotal fixed: ${totalFixed}`);
