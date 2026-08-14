#!/usr/bin/env bash
# with-test-lock.sh — run a command under a per-repo concurrency lock.
#
# Why: the dev machine is a 16 GB M1 Pro shared by multiple agent sessions.
# Duplicate/parallel heavy gates (3x `test:all` on 2026-08-06) caused load > 90
# and swap thrash. This wrapper enforces ONE heavy gate per repo: a second
# concurrent invocation fails fast instead of silently doubling the fork count.
#
# Usage: with-test-lock.sh <command...>
#   Single command:  bash with-test-lock.sh vitest run
#   Chain:           bash with-test-lock.sh bash -c 'pnpm exec vitest run && pnpm exec vitest run --config vitest.integration.config.ts'
#
# Run gates from the repo root (pnpm/npm scripts do this by default). The lock
# lives in node_modules/ so it is gitignored everywhere.
set -euo pipefail

[ $# -gt 0 ] || { echo "usage: with-test-lock.sh <command...>" >&2; exit 2; }

mkdir -p node_modules
lock="node_modules/.test.lock"

if [ -f "$lock" ]; then
  pid="$(cat "$lock" 2>/dev/null || true)"
  if [ -n "$pid" ] && [ -n "$(/bin/ps -p "$pid" -o pid= 2>/dev/null)" ]; then
    echo "ERROR: a test gate is already running (pid $pid, lock: $lock)." >&2
    echo "Wait for it to finish or kill it explicitly. Never start a second gate." >&2
    exit 1
  fi
  echo "WARN: stale test lock (pid $pid is not running) — removing and continuing." >&2
  rm -f "$lock"
fi

echo "$$" > "$lock"
trap 'rm -f "$lock"' EXIT

"$@"
