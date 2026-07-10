#!/usr/bin/env node
/**
 * Fix broken Typography imports that were inserted in the middle of multi-line imports.
 * Strategy: Remove ALL Typography imports, then add them back correctly after the last complete import.
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve("src");
const SKIP_DIRS = new Set(["components/ui", "node_modules"]);

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

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes('from "@/components/ui/typography"')) return false;

  const lines = content.split("\n");
  const newLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip lines that are part of a Typography import (including broken multi-line)
    if (line.includes('from "@/components/ui/typography"')) {
      // Also skip preceding lines that look like part of a broken import
      // e.g., "import {\n" that was left hanging
      i++;
      continue;
    }

    // Check if previous non-empty line was a dangling "import {" (no from)
    if (line.trim() === "" && newLines.length > 0) {
      const prevLine = newLines[newLines.length - 1].trim();
      if (prevLine === "import {" || prevLine === "import {") {
        // This is likely a broken import - skip it
        newLines.pop();
        i++;
        continue;
      }
    }

    newLines.push(line);
    i++;
  }

  // Now find the last complete import statement and add Typography import after it
  const result = [];
  let lastImportEndIdx = -1;

  for (let j = 0; j < newLines.length; j++) {
    const line = newLines[j];
    if (line.match(/^import\s/) && line.endsWith(";")) {
      lastImportEndIdx = j;
    }
    // Also handle multi-line imports that end with ;
    if (line.endsWith(";") && j > 0) {
      // Check if this is the end of a multi-line import
      for (let k = j - 1; k >= 0; k--) {
        if (newLines[k].match(/^import\s/)) {
          lastImportEndIdx = j;
          break;
        }
        if (newLines[k].includes('from "')) break;
      }
    }
  }

  if (lastImportEndIdx >= 0) {
    for (let j = 0; j < newLines.length; j++) {
      result.push(newLines[j]);
      if (j === lastImportEndIdx) {
        result.push('import { Typography } from "@/components/ui/typography";');
      }
    }
  } else {
    // No imports found, add at top
    result.push('import { Typography } from "@/components/ui/typography";');
    result.push(...newLines);
  }

  const newContent = result.join("\n");
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  return false;
}

const files = findTsxFiles(SRC);
let changed = 0;
for (const file of files) {
  if (processFile(file)) {
    changed++;
    console.log(`✓ ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`\nDone: ${changed} files fixed`);
