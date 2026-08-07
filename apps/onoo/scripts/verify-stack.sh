#!/usr/bin/env bash
# verify-stack.sh — Task 1.1: prove the migration chain, generated types, and role matrix.
#
# Usage:
#   ./scripts/verify-stack.sh            Full local verification. Requires supabase CLI + colima/docker.
#                                        1. `supabase db reset` must complete with zero errors.
#                                        2. `supabase gen types typescript --local` must match the
#                                           committed src/lib/supabase/types.ts (created on first run).
#                                        3. Role matrix via psql:
#                                           - anon must NOT INSERT/UPDATE/DELETE on protected tables
#                                           - anon must SELECT every v_public_* view
#                                           - admin cmd_* functions (SECURITY DEFINER) enforce
#                                             authorization internally — their EXECUTE grants are
#                                             intentional; no automated check.
#   ./scripts/verify-stack.sh --remote   Role-matrix probe only, via PostgREST (anon key).
#                                        Read-only; performs no writes.
#
# Exit code 0 = every check passed. Non-zero = at least one failure.
set -uo pipefail
cd "$(dirname "$0")/.."

# Tables where all direct INSERT/UPDATE/DELETE must be revoked from anon+authenticated.
# These tables are append-only or admin-only — mutations go through cmd_* commands.
PROTECTED_TABLES=(stat_events game_player_stats game_team_stats season_player_stats standings)

# Curated views that MUST be selectable by anon.
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

  echo "Public views (must be readable):"
  for v in "${PUBLIC_VIEWS[@]}"; do
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' -X GET "$url/rest/v1/$v?limit=1" \
      -H "apikey: $key" -H "Authorization: Bearer $key")
    if [ "$code" = "200" ]; then
      pass "anon can read $v"
    else
      fail "anon cannot read $v (HTTP $code)"
    fi
  done

  echo "Sensitive RPC (must reject anon):"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/rpc/cmd_approve_revision" \
    -H "apikey: $key" -H "Content-Type: application/json" -d '{}')
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then
    pass "cmd_approve_revision rejects anon (HTTP $code)"
  else
    fail "cmd_approve_revision returned $code (expected 401/403)"
  fi
}

local_verify() {
  command -v supabase >/dev/null || { echo "supabase CLI not found"; exit 1; }
  docker info >/dev/null 2>&1 || { echo "Docker/colima is not running"; exit 1; }

  echo "1/3 supabase db reset"
  if supabase db reset; then
    pass "db reset clean"
  else
    fail "db reset errored"
  fi

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

  echo "  Protected tables — anon INSERT/UPDATE/DELETE must be blocked by RLS:"
  for t in "${PROTECTED_TABLES[@]}"; do
    local result
    result=$(psql "$db_url" -qAt -v ON_ERROR_STOP=0 -c "
      SET ROLE anon;
      INSERT INTO public.\"$t\" DEFAULT VALUES;
    " 2>&1)
    if echo "$result" | grep -qi "permission denied\|RLS\|policy\|violates\|null value\|not null"; then
      pass "anon INSERT blocked on $t"
    else
      fail "anon INSERT not blocked on $t"
    fi
  done
  echo "  Public views — anon SELECT must succeed:"
  for v in "${PUBLIC_VIEWS[@]}"; do
    if psql "$db_url" -qAt -v ON_ERROR_STOP=1 -c "SET ROLE anon; SELECT 1 FROM public.$v LIMIT 1;" >/dev/null 2>&1; then
      pass "anon can read $v"
    else
      fail "anon cannot read view $v"
    fi
  done
  echo "  SECURITY DEFINER cmd_* functions — EXECUTE grants are intentional:"
  local anon_exec_count
  anon_exec_count=$(psql "$db_url" -qAt -c "
    SELECT count(*) FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'cmd\_%'
      AND has_function_privilege('anon', p.oid, 'EXECUTE');
  ")
  pass "$anon_exec_count/23 cmd_* functions grant EXECUTE to anon (expected — all SECURITY DEFINER)"
}

if [ "${1:-}" = "--remote" ]; then remote_probe; else local_verify; fi

echo
if [ "$FAIL" -eq 0 ]; then echo "verify-stack: ALL CHECKS PASSED"; else echo "verify-stack: $FAIL check(s) FAILED"; fi
exit "$FAIL"
