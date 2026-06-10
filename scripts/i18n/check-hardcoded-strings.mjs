#!/usr/bin/env node

/**
 * check-hardcoded-strings.mjs
 *
 * Scans TSX/JSX files for hardcoded user-visible strings that should use
 * the translation system (useTranslations / getTranslations).
 *
 * Modes:
 *   --baseline  Output all findings as JSON to stdout (for generating baseline)
 *   --check     Compare against baseline, fail on NEW findings only
 *   (default)   Report all findings, fail if any exist
 *
 * Exit code 1 if new violations found (in --check mode) or all violations (default).
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const BASELINE_PATH = resolve(__dirname, "hardcoded-baseline.json");

const args = process.argv.slice(2);
const MODE = args.includes("--baseline")
  ? "baseline"
  : args.includes("--check")
    ? "check"
    : "report";

// Directories to scan
const SCAN_DIRS = ["src/app", "src/components"];

// File patterns to include
const INCLUDE_EXTS = [".tsx", ".ts"];

// Files/dirs to skip
const SKIP_PATTERNS = [
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /test-utils/,
  /mock/,
  /example/,
  /\.stories\./,
  /node_modules/,
  /\.next/,
];

// ── String Detection ─────────────────────────────────────────────────────────

/**
 * Detect hardcoded strings in a TSX file using regex patterns.
 * This is intentionally conservative — flagging only obvious cases.
 */
function findHardcodedStrings(filePath, content) {
  const findings = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip lines that already use t() or getTranslations()
    if (/\bt\(["'`]/.test(line) || /getTranslations/.test(line)) continue;

    // Skip comments and imports
    if (/^\s*\/\//.test(line) || /^\s*import/.test(line)) continue;

    // Skip lines that are just type imports or exports
    if (/^\s*export\s+(type|interface)/.test(line)) continue;

    // 1. JSX text content: >Some Text<
    // Matches text between > and < that isn't just whitespace or expressions
    const jsxTextMatches = line.matchAll(
      />\s*([A-Z][a-zA-Z\s.,!?'"-]{3,})\s*</g,
    );
    for (const m of jsxTextMatches) {
      const text = m[1].trim();
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "jsx-text",
          value: text,
        });
      }
    }

    // 2. placeholder="..." and placeholder={'...'}
    const placeholderMatches = line.matchAll(
      /placeholder=["'{]([^"'}]{4,})["'}]/g,
    );
    for (const m of placeholderMatches) {
      const text = m[1];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "placeholder",
          value: text,
        });
      }
    }

    // 3. aria-label="..." and aria-label={'...'}
    const ariaMatches = line.matchAll(/aria-label=["'{]([^"'}]{4,})["'}]/g);
    for (const m of ariaMatches) {
      const text = m[1];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "aria-label",
          value: text,
        });
      }
    }

    // 4. alt="..." for images
    const altMatches = line.matchAll(/alt=["'{]([^"'}]{4,})["'}]/g);
    for (const m of altMatches) {
      const text = m[1];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "alt",
          value: text,
        });
      }
    }

    // 5. title="..." attributes
    const titleMatches = line.matchAll(/\btitle=["'{]([^"'}]{5,})["'}]/g);
    for (const m of titleMatches) {
      const text = m[1];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "title",
          value: text,
        });
      }
    }

    // 6. toast messages: toast.success("..."), toast.error("..."), etc.
    const toastMatches = line.matchAll(
      /toast\.(success|error|warning|info|promise)\(["'`]([^"'`]{4,})["'`]/g,
    );
    for (const m of toastMatches) {
      const text = m[2];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "toast",
          value: text,
        });
      }
    }

    // 7. label="..." prop on form components
    const labelMatches = line.matchAll(/\blabel=["'{]([A-Z][^"'}]{3,})["'}]/g);
    for (const m of labelMatches) {
      const text = m[1];
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "label-prop",
          value: text,
        });
      }
    }

    // 8. <Label>Text</Label>, <Button>Text</Button>, etc. — generic UI text
    const uiTagMatches = line.matchAll(
      /<(?:Label|Button|Badge|Alert|DialogTitle|DialogDescription|SheetTitle|SheetDescription|EmptyTitle|EmptyDescription|CardTitle|CardDescription|FieldLabel|Typography\.\w+)>\s*([A-Z][a-zA-Z\s.,!?'"&-]{2,})\s*</g,
    );
    for (const m of uiTagMatches) {
      const text = m[1].trim();
      if (isUserVisible(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "ui-tag",
          value: text,
        });
      }
    }

    // 9. Template literals with user-visible text in toasts/errors
    const templateMatches = line.matchAll(
      /toast\.(success|error|warning)\(\s*`([^`]{8,})`/g,
    );
    for (const m of templateMatches) {
      const text = m[2];
      if (isUserVisible(text) && !/^\$\{/.test(text)) {
        findings.push({
          file: filePath,
          line: lineNum,
          type: "toast-template",
          value: text,
        });
      }
    }
  }

  return findings;
}

/** Determine if a string is user-visible text that should be translated. */
function isUserVisible(text) {
  if (!text || text.length < 3) return false;

  // Skip pure numbers, punctuation, or whitespace
  if (/^[\s\d\-–—.,:;!?'"(){}[\]/\\@#$%^&*+=|<>~`_]+$/.test(text)) return false;

  // Skip CSS class-like strings
  if (
    /^(flex|grid|block|inline|absolute|relative|fixed|sticky|hidden|visible)/.test(
      text,
    )
  )
    return false;

  // Skip import paths and URLs
  if (/^(https?:|\/|@|~|\.\.?\/)/.test(text)) return false;

  // Skip technical identifiers
  if (
    /^(div|span|section|main|nav|header|footer|button|input|form)$/i.test(text)
  )
    return false;

  // Skip strings that are mostly interpolation: "${...}"
  if (
    /^\$\{/.test(text) &&
    !/[a-zA-Z]{3}/.test(text.replace(/\$\{[^}]+\}/g, ""))
  )
    return false;

  // Skip brand/technical names that are legitimately English
  const BRANDS =
    /^(API|CSS|HTML|JS|TS|URL|URI|PDF|CSV|SQL|JWT|TLS|SSL|REST|GraphQL|WebSocket|React|Next\.js|Supabase|Vercel|Biome|Playwright|Tailwind|shadcn|Radix|Vercel|Node\.js)$/i;
  if (BRANDS.test(text.trim())) return false;

  // Skip single words that are commonly kept in English in Mongolian context
  const LOANWORDS =
    /^(OK|Cancel|Delete|Save|Edit|Add|Remove|Close|Back|Next|Loading|Error|Warning|Success|Search|Filter|Sort|All|None|Total|Status|Type|Name|Date|Action|Actions|Description|Amount|Price|Quantity|Unit|Category|Phone|Email|VIN|Note|Notes|Draft|Paid|Sent|Overdue|Partial|Active|Inactive|Yes|No|Select|Optional|Required|Done|Syncing|Expired|Feature)$/i;
  if (LOANWORDS.test(text.trim())) return false;

  // Must contain at least one Latin letter with meaningful context
  return /[a-zA-Z]{3,}/.test(text);
}

// ── File Discovery ───────────────────────────────────────────────────────────

function findFiles(dirs, exts) {
  const files = [];
  for (const dir of dirs) {
    const absDir = resolve(ROOT, dir);
    if (!existsSync(absDir)) continue;

    const result = execSync(
      `find "${absDir}" -type f \\( ${exts.map((e) => `-name "*${e}"`).join(" -o ")} \\) | head -500`,
      { encoding: "utf8" },
    );

    for (const file of result.trim().split("\n")) {
      if (!file) continue;
      if (SKIP_PATTERNS.some((p) => p.test(file))) continue;
      files.push(file);
    }
  }
  return files;
}

// ── Baseline ─────────────────────────────────────────────────────────────────

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return new Set();
  try {
    const data = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    return new Set(
      data.map(
        (f) => `${relative(ROOT, f.file)}:${f.line}:${f.type}:${f.value}`,
      ),
    );
  } catch {
    return new Set();
  }
}

function saveBaseline(findings) {
  writeFileSync(BASELINE_PATH, JSON.stringify(findings, null, 2) + "\n");
}

function findingKey(f) {
  return `${relative(ROOT, f.file)}:${f.line}:${f.type}:${f.value}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = findFiles(SCAN_DIRS, INCLUDE_EXTS);
console.log(`Scanning ${files.length} files...\n`);

let allFindings = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const findings = findHardcodedStrings(file, content);
  allFindings.push(...findings);
}

// Deduplicate by file+line+value
const seen = new Set();
allFindings = allFindings.filter((f) => {
  const key = findingKey(f);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Sort by file path then line number
allFindings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const rel = (f) => relative(ROOT, f.file);

if (MODE === "baseline") {
  saveBaseline(allFindings);
  console.log(`✅ Baseline saved with ${allFindings.length} findings.`);
  process.exit(0);
}

if (MODE === "check") {
  const baseline = loadBaseline();
  const newFindings = allFindings.filter((f) => !baseline.has(findingKey(f)));

  if (newFindings.length === 0) {
    console.log(`✅ No new hardcoded strings (baseline: ${baseline.size}).`);
    process.exit(0);
  }

  console.error(`❌ ${newFindings.length} NEW hardcoded strings found:\n`);
  for (const f of newFindings) {
    console.error(`  ${rel(f)}:${f.line}  [${f.type}]  "${f.value}"`);
  }
  console.error(
    `\nRun: node scripts/i18n/check-hardcoded-strings.mjs --baseline`,
  );
  console.error(`to update baseline after migrating these strings.\n`);
  process.exit(1);
}

// Default: report mode — show all findings
if (allFindings.length === 0) {
  console.log("✅ No hardcoded strings found.");
  process.exit(0);
}

console.log(`Found ${allFindings.length} hardcoded strings:\n`);

let currentFile = "";
for (const f of allFindings) {
  if (f.file !== currentFile) {
    currentFile = f.file;
    console.log(`\n${rel(f)}:`);
  }
  console.log(`  L${f.line}  [${f.type}]  "${f.value}"`);
}

console.log(
  `\n${allFindings.length} total findings in ${new Set(allFindings.map((f) => f.file)).size} files.`,
);
console.log(
  `\nTo generate baseline: node scripts/i18n/check-hardcoded-strings.mjs --baseline`,
);
process.exit(1);
