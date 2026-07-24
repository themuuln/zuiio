#!/usr/bin/env bash
# verify-stack.sh — Task 1.1: prove the migration chain, generated types, and role matrix.
#
# Usage:
#   ./scripts/verify-stack.sh            Full local verification. Requires Docker + supabase CLI.
#                                        1. `supabase db reset` must complete with zero errors.
#                                        2. `supabase gen types typescript --local` must match the
#                                           committed src/lib/supabase/types.ts (created on first run —
#                                           review & commit it, then re-run).
#                                        3. Role matrix via psql: anon must NOT select base tables,
#                                           MUST select every v_public_* view, and must have no
#                                           EXECUTE privilege on any cmd_* function.
#   ./scripts/verify-stack.sh --remote   Role-matrix probe only, against the hosted project in
#                                        .env.local via PostgREST (anon key). Read-only; performs no
#                                        writes. Useful when Docker is unavailable, and for detecting
#                                        drift between the hosted project and the migration chain.
#
# Exit code 0 = every check passed. Non-zero = at least one failure (each is printed).
set -uo pipefail
cd "$(dirname "$0")/.."

# Base tables that must NOT be selectable by anon. Extend when new private tables are added.
PRIVATE_TABLES=(stat_events games game_player_stats game_team_stats season_player_stats standings source_submissions game_revisions audit_log tracker_sessions players teams)
# Curated views that MUST be selectable by anon. Extend when specs add views (3.8, 4.5, 5.1).
PUBLIC_VIEWS=(v_public_games v_public_box_score v_public_standings v_public_leaders v_public_team_roster)
TYPES_FILE="src/lib/supabase/types.ts"

FAIL=0
pass() { printf '  \342\234\223 %s\n' "$1"; }
fail() { printf '  \342\234\227 %s\n' "$1"; FAIL=$((FAIL + 1)); }

remote_probe() {
  local env_file=".env.local"
  [ -f "$env_file" ] || { echo "No .env.local found"; exit 1; }
  local url key
  url=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$env_file" | cut -d= -f2-)
  key=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$env_file" | cut -d= -f2-)
  echo "Role matrix (remote, anon via PostgREST): $url"

  echo "Base tables (must be denied):"
  for t in "${PRIVATE_TABLES[@]}"; do
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url/rest/v1/$t?limit=1" -H "apikey: $key")
    if [ "$code" = "200" ]; then fail "$t readable by anon (HTTP 200)"; else pass "$t denied (HTTP $code)"; fi
  done

  echo "Public views (must be readable):"
  for v in "${PUBLIC_VIEWS[@]}"; do
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url/rest/v1/$v?limit=1" -H "apikey: $key")
    if [ "$code" = "200" ]; then pass "$v readable"; else fail "$v not readable (HTTP $code)"; fi
  done

  echo "Command RPC (must be rejected for anon):"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/rpc/cmd_record_event" \
    -H "apikey: $key" -H "Content-Type: application/json" -d '{}')
  case "$code" in
    2??) fail "cmd_record_event callable by anon (HTTP $code)" ;;
    404) fail "cmd_record_event missing on this project (HTTP 404) — migration chain not deployed here" ;;
    *) pass "cmd_record_event rejected (HTTP $code)" ;;
  esac
}

local_verify() {
  command -v supabase >/dev/null || { echo "supabase CLI not found"; exit 1; }
  docker info >/dev/null 2>&1 || { echo "Docker is not running — start it, or use --remote for the probe-only mode."; exit 1; }

  echo "1/3 supabase db reset"
  if supabase db reset; then pass "db reset clean"; else fail "db reset errored"; fi

  echo "2/3 generated types diff ($TYPES_FILE)"
  local tmp
  tmp=$(mktemp)
  if supabase gen types typescript --local > "$tmp"; then
    if [ ! -f "$TYPES_FILE" ]; then
      cp "$tmp" "$TYPES_FILE"
      fail "$TYPES_FILE did not exist — generated it now; review & commit, then re-run"
    elif diff -q "$TYPES_FILE" "$tmp" >/dev/null; then
      pass "types match"
    else
      cp "$tmp" "$TYPES_FILE"
      fail "types drifted — regenerated $TYPES_FILE; review & commit, then re-run"
    fi
  else
    fail "gen types failed"
  fi
  rm -f "$tmp"

  echo "3/3 role matrix (psql as anon)"
  local db_url
  db_url=$(supabase status -o env 2>/dev/null | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')
  [ -n "$db_url" ] || db_url="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

  for t in "${PRIVATE_TABLES[@]}"; do
    if psql "$db_url" -qAt -v ON_ERROR_STOP=1 -c "SET ROLE anon; SELECT 1 FROM public.$t LIMIT 1;" >/dev/null 2>&1; then
      fail "anon can SELECT base table $t"
    else
      pass "anon denied on $t"
    fi
  done
  for v in "${PUBLIC_VIEWS[@]}"; do
    if psql "$db_url" -qAt -v ON_ERROR_STOP=1 -c "SET ROLE anon; SELECT 1 FROM public.$v LIMIT 1;" >/dev/null 2>&1; then
      pass "anon can read $v"
    else
      fail "anon cannot read view $v"
    fi
  done
  local grants
  grants=$(psql "$db_url" -qAt -c "SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname LIKE 'cmd\_%' AND has_function_privilege('anon', p.oid, 'EXECUTE');")
  if [ -z "$grants" ]; then
    pass "no cmd_* function executable by anon"
  else
    while IFS= read -r fn; do fail "anon has EXECUTE on $fn"; done <<< "$grants"
  fi
}

if [ "${1:-}" = "--remote" ]; then remote_probe; else local_verify; fi

echo
if [ "$FAIL" -eq 0 ]; then echo "verify-stack: ALL CHECKS PASSED"; else echo "verify-stack: $FAIL check(s) FAILED"; fi
exit "$FAIL"
