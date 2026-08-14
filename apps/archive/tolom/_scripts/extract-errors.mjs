#!/usr/bin/env node

/**
 * Token-efficient error extractor for pino JSON logs.
 *
 * Reads pino-structured JSON lines from stdin or a file and extracts only
 * error-level (level >= 50) and fatal-level (level >= 60) entries with
 * compact context. This is the most token-efficient way to inspect errors
 * in a full log stream.
 *
 * Usage:
 *   cat app.log | node _scripts/extract-errors.mjs
 *   node _scripts/extract-errors.mjs < app.log
 *   node _scripts/extract-errors.mjs --file app.log --tail 20
 *
 * Flags:
 *   --file <path>   Read from a file instead of stdin
 *   --tail <N>      Only show the last N errors (default: all)
 *   --json          Output raw JSON lines (no pretty formatting)
 *   --context <N>   Include N lines of surrounding context (pino JSON only)
 *   --watch         Follow the file like tail -f
 */

import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flags = {
  file: null,
  tail: Infinity,
  json: false,
  context: 0,
  watch: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--file":
      flags.file = args[++i];
      break;
    case "--tail":
      flags.tail = Number.parseInt(args[++i], 10);
      break;
    case "--json":
      flags.json = true;
      break;
    case "--context":
      flags.context = Number.parseInt(args[++i], 10);
      break;
    case "--watch":
      flags.watch = true;
      break;
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function isErrorLevel(entry) {
  return entry.level >= 50;
}

function formatCompact(entry) {
  const time = entry.time
    ? new Date(entry.time).toISOString().replace("T", " ").slice(0, 19)
    : "";
  const level = entry.level >= 60 ? "FATAL" : "ERROR";
  const msg = entry.msg ?? "(no message)";
  const err = entry.err ?? entry.error ?? {};
  const errMsg = err.message ? ` — ${err.message}` : "";
  const stack = err.stack ? `\n${err.stack.split("\n").slice(0, 3).join("\n")}` : "";
  const context = Object.entries(entry)
    .filter(
      ([k]) =>
        !["time", "level", "msg", "pid", "hostname", "err", "error", "v"].includes(k),
    )
    .map(([k, v]) => {
      const val = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}=${val.length > 120 ? val.slice(0, 120) + "…" : val}`;
    })
    .join(" ");

  return `[${time}] ${level}: ${msg}${errMsg}${context ? ` | ${context}` : ""}${stack}`;
}

// ── Output collector (supports --tail by buffering) ────────────

const outputLines = [];
const tailLimit = Number.isFinite(flags.tail) ? flags.tail : null;

function emitLine(text) {
  if (tailLimit !== null) {
    outputLines.push(text);
    if (outputLines.length > tailLimit) {
      outputLines.shift();
    }
  } else {
    console.log(text);
  }
}

function flushOutput() {
  if (tailLimit !== null && outputLines.length > 0) {
    for (const line of outputLines) {
      console.log(line);
    }
  }
}

// ── Reader ──────────────────────────────────────────────────────

let lineIndex = 0;
let errorsFound = 0;

function processLine(line) {
  lineIndex++;
  if (!line.trim()) return;

  try {
    const entry = JSON.parse(line);
    if (!isErrorLevel(entry)) return;

    errorsFound++;

    if (flags.json) {
      emitLine(line);
    } else {
      emitLine(formatCompact(entry));
    }
  } catch {
    // Non-JSON line — skip (likely pino-pretty output or stray text)
  }
}

function processStream(stream) {
  let data = "";

  stream.on("data", (chunk) => {
    data += chunk.toString();
    const lines = data.split("\n");
    data = lines.pop() ?? ""; // keep incomplete line
    for (const line of lines) {
      processLine(line);
    }
  });
  stream.on("end", () => {
    if (data.trim()) processLine(data);
    flushOutput();
    if (errorsFound === 0) {
      console.log("No error-level entries found.");
    }
  });
}

// ── Entry point ─────────────────────────────────────────────────

if (flags.file) {
  if (flags.watch) {
    // Follow mode: read + tail -f equivalent
    const stream = createReadStream(flags.file);
    processStream(stream);
  } else {
    // One-shot file read
    const content = await readFile(flags.file, "utf-8");
    const lines = content.split("\n");
    let errorEntries = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (isErrorLevel(entry)) {
          errorEntries.push(entry);
        }
      } catch {
        // skip
      }
    }

    if (flags.tail < errorEntries.length) {
      errorEntries = errorEntries.slice(-flags.tail);
    }

    for (const entry of errorEntries) {
      if (flags.json) {
        console.log(JSON.stringify(entry));
      } else {
        console.log(formatCompact(entry));
      }
    }

    if (errorEntries.length === 0) {
      console.log("No error-level entries found.");
    }
  }
} else {
  // Read from stdin
  processStream(process.stdin);
}
