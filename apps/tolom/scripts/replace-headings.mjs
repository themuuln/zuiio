#!/usr/bin/env node
/**
 * Replace raw h1-h4 elements with Typography components.
 * Correctly places the import after the last import statement.
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
    // Single-line import: starts with import and contains from
    if (line.match(/^import\s+.*from\s+["']/)) {
      lastImportIdx = i;
    }
    // Multi-line import start: starts with import { but no from
    if (line.match(/^import\s*\{/) && !line.includes("from ")) {
      // Find the closing line with from "..."
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
  let content = fs.readFileSync(filePath, "utf-8");

  // Replace h1-h4 opening and closing tags
  let modified = false;
  for (const level of ["h1", "h2", "h3", "h4"]) {
    const openRegex = new RegExp(`<${level}(\\s)`, "g");
    const closeRegex = new RegExp(`</${level}>`, "g");

    if (openRegex.test(content)) {
      content = content.replace(
        openRegex,
        `<Typography.${level.toUpperCase()}$1`,
      );
      content = content.replace(
        closeRegex,
        `</Typography.${level.toUpperCase()}>`,
      );
      modified = true;
    }
  }

  if (!modified) return false;

  // Add Typography import if not present
  if (!content.includes(TYPOGRAPHY_IMPORT)) {
    const lines = content.split("\n");
    const lastImportIdx = findLastImportLineIndex(lines);

    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, TYPOGRAPHY_IMPORT);
      content = lines.join("\n");
    }
  }

  fs.writeFileSync(filePath, content);
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
