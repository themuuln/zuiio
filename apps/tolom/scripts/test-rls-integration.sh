#!/usr/bin/env bash
# RLS Integration Tests — multi-tenant isolation behavior suite.
#
# Runs src/lib/__tests__/integration/*-rls.test.ts (13 files, 131 tests)
# against the LOCAL Supabase stack. These tests skip by default because they
# require SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY, so they never ran
# anywhere automated on GitHub free tier. This is the local runner.
#
# Prerequisites:
#   - supabase CLI installed and logged in
#   - Local stack running:  supabase start
#   - Migrations applied:   supabase db push   (or supabase migration up)
#
# Usage: bash scripts/test-rls-integration.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: supabase CLI not found (needed for 'supabase status')." >&2
  exit 1
fi

STATUS_JSON="$(supabase status -o json 2>/dev/null || true)"
if [ -z "$STATUS_JSON" ] || [ "$STATUS_JSON" = "null" ]; then
  echo "ERROR: local Supabase stack is not running. Start it with:" >&2
  echo "  supabase start" >&2
  echo "then apply migrations: supabase db push" >&2
  exit 1
fi

ANON_KEY="$(printf '%s' "$STATUS_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);process.stdout.write(j.ANON_KEY??j.anon_key??'')}catch{}})" 2>/dev/null || true)"
SERVICE_KEY="$(printf '%s' "$STATUS_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);process.stdout.write(j.SERVICE_ROLE_KEY??j.service_role_key??'')}catch{}})" 2>/dev/null || true)"

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
  echo "ERROR: could not read API keys from 'supabase status -o json'." >&2
  echo "Check the CLI version and the local stack." >&2
  exit 1
fi

export SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54361}"
export SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

echo "Running RLS integration suite against local Supabase ($SUPABASE_URL)..."
# Sequential: the org-creation triggers (auto_seed_permissions) contend under
# parallel file execution and hit the statement timeout.
exec bash scripts/with-test-lock.sh ./node_modules/.bin/vitest run --project node --no-file-parallelism src/lib/__tests__/integration
