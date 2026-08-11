#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Vercel Key Rotation Script — Zuiio Monorepo
# ──────────────────────────────────────────────────────────────────────────────
# Rotates an API key across a Vercel project's environments (production,
# preview, development) and redeploys production so the new value goes live.
#
# Presets:
#   opencode  → agent-gateway  OPENCODE_API_KEY          (production + development)
#   supabase  → zer            SUPABASE_SERVICE_ROLE_KEY (production + preview + development)
#
# Usage:
#   ./scripts/rotate-key.sh opencode  <new-key>    # rotate the OpenCode Go key
#   ./scripts/rotate-key.sh supabase <new-key>     # rotate the Supabase service role key
#   ./scripts/rotate-key.sh verify opencode <key>  # validate a key without deploying
#   ./scripts/rotate-key.sh verify supabase <key>
#
# The key may be passed as the second argument or piped via stdin:
#   ./scripts/rotate-key.sh opencode < 1password.txt
#
# Every rotation: 1) validates the new key, 2) PATCHes the Vercel env entries,
# 3) redeploys production, 4) waits for Ready. The old key stays valid until
# the new deployment is live, so rotation is zero-downtime.
#
# Zero-redeploy alternative (if you rotate very often): agent-gateway already
# ships Redis key rotation (src/lib/key-rotation.ts). Set UPSTASH_REDIS_REST_URL
# + UPSTASH_REDIS_REST_TOKEN on agent-gateway, then rotation is:
#   redis-cli SET opencode:keys "key1,key2"
# — picked up within 5 minutes, no Vercel, no redeploy.
#
# NOTE: for the OpenCode Go key, the machine-wide tool is
#   ~/.local/bin/opencode-rotate   (echo "sk-..." | opencode-rotate)
# which covers ALL consumers (local harness, Redis pool, Vercel env, tamga,
# zatly, horoscope-bot). This script's `opencode` preset is the Vercel-env
# fallback only; use it directly when Redis is not configured.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
err()   { echo -e "${RED}[ERR]${NC} $*" >&2; }
die()   { err "$*"; exit 1; }

# Vercel project registry (zerone account)
ZER_PROJECT="prj_D2vMKjhrj5nQ6Ex6oMUARbvxGr5C"          # zer
GATEWAY_PROJECT="prj_VYHkd4rkcpzpeCT9qTBI0w1OC45A"      # agent-gateway
VERCEL_SCOPE="themuulns-projects"
SUPABASE_URL="https://krrkhozadforrydffegg.supabase.co"

# ─── Token ───────────────────────────────────────────────────────────────────
get_vercel_token() {
  agent-pass show zuiio/vercel/zerone 2>/dev/null \
    || die "agent-pass could not read zuiio/vercel/zerone (token)."
}

# ─── Key validation ──────────────────────────────────────────────────────────
verify_opencode_key() {
  local key="$1" code
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $key" \
    "https://opencode.ai/zen/go/v1/models")
  case "$code" in
    200) ok "OpenCode Go key valid (models endpoint 200)." ;;
    401) die "Key rejected (401): wrong/expired key." ;;
    403) die "Key blocked (403): region opt-in or workspace mismatch. Open the workspace link in the error body." ;;
    429) die "Go usage limit reached (429)." ;;
    *)   die "Unexpected HTTP $code from opencode.ai models endpoint." ;;
  esac
}

verify_supabase_key() {
  local key="$1" code
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $key" -H "Authorization: Bearer $key" \
    "$SUPABASE_URL/rest/v1/organizations?select=id&limit=1")
  [ "$code" = "200" ] || die "Supabase key rejected (HTTP $code) against $SUPABASE_URL."
  ok "Supabase key valid (REST 200)."
}

# ─── Vercel env update ───────────────────────────────────────────────────────
# PATCH the value on every env entry for the given project+key. Falls back to
# rm+create if PATCH is rejected.
update_env_entries() {
  local project="$1" key_name="$2" new_value="$3" token="$4"
  local env_json ids entry_id target
  env_json=$(curl -s "https://api.vercel.com/v9/projects/$project/env" -H "Authorization: Bearer $token")
  ids=$(echo "$env_json" | jq -r --arg k "$key_name" '.envs[] | select(.key==$k) | [.id, (.target|join(",")), .type] | @tsv')
  [ -n "$ids" ] || die "No env entry found for $key_name on project $project."
  while IFS=$'\t' read -r entry_id target entry_type; do
    [ -n "$entry_id" ] || continue
    local patch
    patch=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH \
      "https://api.vercel.com/v9/projects/$project/env/$entry_id" \
      -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
      -d "$(jq -nc --arg v "$new_value" '{value:$v}')")
    if [ "$patch" = "200" ] || [ "$patch" = "201" ]; then
      ok "$key_name → $target (PATCH $patch)"
    else
      warn "$key_name → $target PATCH failed ($patch); falling back to rm+create"
      curl -s -o /dev/null -X DELETE "https://api.vercel.com/v9/projects/$project/env/$entry_id" \
        -H "Authorization: Bearer $token"
      local created
      created=$(curl -s -X POST "https://api.vercel.com/v9/projects/$project/env" \
        -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
        -d "$(jq -nc --arg k "$key_name" --arg v "$new_value" --arg t "$target" --arg ty "${entry_type:-encrypted}" \
              '{key:$k,value:$v,type:$ty,target:[$t]}')")
      echo "$created" | jq -e '.key' >/dev/null 2>&1 \
        && ok "$key_name → $target (recreated)" \
        || die "Failed to recreate $key_name: $(echo "$created" | jq -r '.error.message // .' 2>/dev/null)"
    fi
  done <<< "$ids"
}

# ─── Redeploy production ─────────────────────────────────────────────────────
redeploy_production() {
  local project="$1" token="$2"
  local url
  url=$(curl -s "https://api.vercel.com/v6/deployments?projectId=$project&target=production&state=READY&limit=1" \
    -H "Authorization: Bearer $token" | jq -r '.deployments[0].url')
  [ -n "$url" ] && [ "$url" != "null" ] || die "No READY production deployment found for project $project."
  info "Redeploying production (latest: $url)…"
  VERCEL_TELEMETRY_DISABLED=1 VERCEL_TOKEN="$token" vercel redeploy "$url" --target production -S "$VERCEL_SCOPE" \
    | tail -5
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
  [ $# -ge 1 ] || { echo "Usage: $0 {opencode|supabase} <key> | verify {opencode|supabase} <key>"; exit 1; }
  local mode="$1"
  local key=""
  if [ $# -ge 2 ]; then
    key="$2"
  elif [ ! -t 0 ]; then
    key=$(cat)
  fi
  [ -n "$key" ] || die "No key provided (argument or stdin)."

  local token project key_name
  token=$(get_vercel_token)

  case "$mode" in
    verify)
      local which="${2:-}"; [ $# -ge 3 ] || die "verify needs: $0 verify {opencode|supabase} <key>"
      key="$3"
      case "$which" in
        opencode) verify_opencode_key "$key" ;;
        supabase) verify_supabase_key "$key" ;;
        *) die "Unknown verify target: $which" ;;
      esac
      ;;
    opencode)
      project="$GATEWAY_PROJECT"; key_name="OPENCODE_API_KEY"
      verify_opencode_key "$key"
      update_env_entries "$project" "$key_name" "$key" "$token"
      redeploy_production "$project" "$token"
      ok "OpenCode Go key rotated on agent-gateway (production + development)."
      ;;
    supabase)
      project="$ZER_PROJECT"; key_name="SUPABASE_SERVICE_ROLE_KEY"
      verify_supabase_key "$key"
      update_env_entries "$project" "$key_name" "$key" "$token"
      redeploy_production "$project" "$token"
      ok "Supabase service role key rotated on zer (production + preview + development)."
      ;;
    *)
      die "Unknown target: $mode. Use {opencode|supabase} or verify."
      ;;
  esac
}

main "$@"
