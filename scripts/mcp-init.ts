#!/usr/bin/env tsx
/**
 * mcp-init – Generate per-platform MCP configs for a new project.
 *
 * Usage:
 *   pnpm mcp:init <nextjs|flutter> <project-name> [--ref=<supabase-ref>] [--features=<full|minimal>]
 *
 * Examples:
 *   pnpm mcp:init nextjs tolom --ref=fhzuolncswccxkcqzclg
 *   pnpm mcp:init nextjs zerbu --ref=krrkhozadforrydffegg --features=minimal
 *   pnpm mcp:init flutter tamga --ref=oxnvbgdlhrgzzuyrnebf
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [type, projectName] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const refArg = process.argv.find((a) => a.startsWith("--ref="));
const projectRef = refArg?.split("=")[1];
const featuresArg = process.argv.find((a) => a.startsWith("--features="));
const features = featuresArg?.split("=")[1] || "full";
const supabaseFeatures =
  features === "minimal"
    ? "docs%2Cdatabase"
    : "docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage";

const TEMPLATE_MAP: Record<string, Record<string, string>> = {
  nextjs: {
    "_omp.json": ".omp/mcp.json",
    "_pi.json": ".pi/mcp.json",
    "_factory.json": ".factory/mcp.json",
    "_codex.toml": ".codex/config.toml",
  },
  flutter: {
    "_pi.json": ".pi/mcp.json",
    "_factory.json": ".factory/mcp.json",
    "_codex.toml": ".codex/config.toml",
  },
};

function bail(msg: string): never {
  console.error(`\n  ❌ ${msg}\n`);
  process.exit(1);
}

// --- Validation ---
if (!type)
  bail(
    "Missing project type. Usage: pnpm mcp:init <nextjs|flutter> <name> --ref=<ref>",
  );
if (!["nextjs", "flutter"].includes(type))
  bail(`Unknown type "${type}". Use "nextjs" or "flutter".`);
if (!projectName)
  bail(
    "Missing project name. Usage: pnpm mcp:init <nextjs|flutter> <name> --ref=<ref>",
  );
if (!projectRef) bail("Missing --ref=<supabase-project-ref>");

const projectDir = join(process.cwd(), "..", projectName);
if (!existsSync(projectDir))
  bail(`Project directory not found: ../${projectName}`);

const templateDir = join(process.cwd(), "templates", "mcp", type);
if (!existsSync(templateDir))
  bail(`Template directory not found: templates/mcp/${type}`);

const fileMap = TEMPLATE_MAP[type];
let count = 0;

for (const [src, dest] of Object.entries(fileMap)) {
  const srcPath = join(templateDir, src);
  if (!existsSync(srcPath)) {
    console.warn(`  ⚠  Template missing: ${src} — skipping ${dest}`);
    continue;
  }

  const destPath = join(projectDir, dest);
  mkdirSync(dirname(destPath), { recursive: true });
  let content = readFileSync(srcPath, "utf-8");
  content = content.replace(/\{\{PROJECT_REF\}\}/g, projectRef);
  content = content.replace(/\{\{SUPABASE_FEATURES\}\}/g, supabaseFeatures);

  writeFileSync(destPath, content);
  process.stdout.write(`  ✓ ${dest}\n`);
  count++;
}

process.stdout.write(
  `\n  ✅ Generated ${count} MCP config${count !== 1 ? "s" : ""} for ../${projectName}\n`,
);
