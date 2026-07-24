#!/usr/bin/env node
/**
 * Replace raw <p> elements with Typography components.
 * Uses a state machine to correctly pair opening/closing tags.
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve("src");
const SKIP_DIRS = new Set(["components/ui", "node_modules"]);
const TYPOGRAPHY_IMPORT =
  'import { Typography } from "@/components/ui/typography";';

function findTsxFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(path.relative(SRC, path.join(dir, entry.name))))
        continue;
      results.push(...findTsxFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function findLastImportLineIndex(lines) {
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^import\s+.*from\s+["']/)) {
      lastImportIdx = i;
    }
    if (line.match(/^import\s*\{/) && !line.includes("from ")) {
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('from "') || lines[j].includes("from '")) {
          lastImportIdx = j;
          break;
        }
      }
    }
  }
  return lastImportIdx;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Only process files that have raw <p> elements
  if (!content.match(/<p[\s>]/)) return false;

  // Skip files already using Typography for p
  if (
    content.includes("<Typography.Muted") ||
    content.includes("<Typography.Text") ||
    content.includes("<Typography.P")
  ) {
    return false;
  }

  let modified = false;

  // Phase 1: Replace all <p opening tags with Typography variant
  // Process line by line, tracking whether we're in a Muted or Text context
  const lines = content.split("\n");
  const tagStack = []; // Track opening tags: ["Muted", "Text", etc.]

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Find <p opening tags in this line
    const pOpenRegex = /<p([\s>])/g;
    let match;

    while ((match = pOpenRegex.exec(line)) !== null) {
      const isMuted = line.includes("text-muted-foreground");
      const variant = isMuted ? "Muted" : "Text";
      tagStack.push(variant);

      // Replace <p with Typography variant
      const before = line.substring(0, match.index);
      const after = line.substring(match.index + 2);
      line = before + "<Typography." + variant + after;

      // Reset regex lastIndex since we modified the string
      pOpenRegex.lastIndex = match.index + ("<Typography." + variant).length;
    }

    // Find </p> closing tags in this line
    const pCloseRegex = /<\/p>/g;
    while ((match = pCloseRegex.exec(line)) !== null) {
      const variant = tagStack.pop() || "Text";
      const before = line.substring(0, match.index);
      const after = line.substring(match.index + 4);
      line = before + "</Typography." + variant + ">" + after;
      pCloseRegex.lastIndex =
        match.index + ("</Typography." + variant + ">").length;
      modified = true;
    }

    // Also check if we already had <p replaced but need to fix closing tags
    if (
      line.includes("<Typography.") &&
      !line.includes("</Typography.") &&
      line.includes("</p>")
    ) {
      const variant = tagStack.pop() || "Text";
      line = line.replace("</p>", "</Typography." + variant + ">");
      modified = true;
    }

    // Mark as modified if opening tag was replaced
    if (
      line.includes("<Typography.Muted") ||
      line.includes("<Typography.Text")
    ) {
      if (lines[i] !== line) modified = true;
    }

    lines[i] = line;
  }

  if (!modified) return false;

  let content2 = lines.join("\n");

  // Add Typography import if not present
  if (!content2.includes(TYPOGRAPHY_IMPORT)) {
    const lines2 = content2.split("\n");
    const lastImportIdx = findLastImportLineIndex(lines2);
    if (lastImportIdx >= 0) {
      lines2.splice(lastImportIdx + 1, 0, TYPOGRAPHY_IMPORT);
      content2 = lines2.join("\n");
    }
  }

  fs.writeFileSync(filePath, content2);
  return true;
}

const files = findTsxFiles(SRC);
let changed = 0;
for (const file of files) {
  if (processFile(file)) {
    changed++;
    console.log(`✓ ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`\nDone: ${changed} files modified`);
