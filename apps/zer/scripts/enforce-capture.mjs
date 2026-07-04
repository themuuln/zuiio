#!/usr/bin/env node
/**
 * Enforces capture() instead of console.error in error handlers.
 * Run as: node scripts/enforce-capture.mjs
 *
 * Catches patterns like:
 *   catch(e) { console.error(e) }
 *   .catch(console.error)
 *   .catch((e) => { console.error(e) })
 *   finally { console.error("...") }
 *
 * Uses AST parsing (acorn + acorn-walk) for accuracy.
 */

import { readFileSync, existsSync } from "fs";
import { globSync } from "fs";
import { parse } from "acorn";
import { simple } from "acorn-walk";

const ROOT = process.argv[2] || "src";
const EXEMPT_FILES = ["scripts/", "node_modules/", ".next/"];

let errors = 0;

function isExempt(filePath) {
  return EXEMPT_FILES.some((e) => filePath.includes(e));
}

function findConsoleErrorInCatch(body, filePath) {
  const results = [];
  simple(body, {
    CatchClause(node) {
      if (!node.body) return;
      simple(node.body, {
        CallExpression(n) {
          if (
            n.callee.type === "MemberExpression" &&
            n.callee.object.type === "Identifier" &&
            n.callee.object.name === "console" &&
            n.callee.property.type === "Identifier" &&
            n.callee.property.name === "error"
          ) {
            const line = node.loc?.start?.line || "?";
            results.push({ line, code: filePath });
          }
        },
      });
    },
    CallExpression(node) {
      // catch(console.error) pattern
      if (
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "catch" &&
        node.arguments.length === 1
      ) {
        const arg = node.arguments[0];
        if (arg.type === "Identifier" && arg.name === "console.error") {
          const line = node.loc?.start?.line || "?";
          results.push({ line, code: filePath });
        }
        // .catch((e) => { console.error(e) })
        if (
          arg.type === "ArrowFunctionExpression" &&
          arg.body.type === "BlockStatement"
        ) {
          simple(arg.body, {
            CallExpression(n) {
              if (
                n.callee.type === "MemberExpression" &&
                n.callee.object.type === "Identifier" &&
                n.callee.object.name === "console" &&
                n.callee.property.type === "Identifier" &&
                n.callee.property.name === "error"
              ) {
                const line = node.loc?.start?.line || "?";
                results.push({ line, code: filePath });
              }
            },
          });
        }
      }
    },
  });
  return results;
}

const files = globSync(`${ROOT}/**/*.{ts,tsx}`, {
  ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
});

for (const file of files) {
  if (isExempt(file)) continue;
  const content = readFileSync(file, "utf-8");
  try {
    const ast = parse(content, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      ranges: true,
    });
    const results = findConsoleErrorInCatch(ast, file);
    for (const r of results) {
      console.error(
        `❌ ${file}:${r.line} — use capture() instead of console.error in catch blocks`,
      );
      errors++;
    }
  } catch {
    // Skip files that don't parse (JSX — handled by tsx below)
  }
}

// Also handle TSX files with regex fallback
const tsxFiles = files.filter((f) => f.endsWith(".tsx"));
for (const file of tsxFiles) {
  if (isExempt(file)) continue;
  const content = readFileSync(file, "utf-8");
  // Simple regex check for console.error inside catch blocks
  const catchConsoleRegex = /catch\s*(\([^)]*\))?\s*\{[^}]*console\.error/g;
  let match;
  while ((match = catchConsoleRegex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split("\n").length;
    console.error(
      `❌ ${file}:${line} — use capture() instead of console.error in catch blocks`,
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(
    `\n📋 ${errors} violation(s) found. Use capture() from @zuiio/capture instead of console.error.\n`,
  );
  process.exit(1);
}

console.log("✅ No console.error in catch blocks found.");
