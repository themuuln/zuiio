#!/usr/bin/env bash
set -euo pipefail

# Secret-safe production configuration for agent-gateway.
# Does not print secret values. Run from any directory.
#
# Examples:
#   ./scripts/configure-production-env.sh --model mimo-v2.5
#   ./scripts/configure-production-env.sh --model <model-id> --no-redeploy
#   OPENCODE_API_KEY=... ./scripts/configure-production-env.sh --model mimo-v2.5

PROJECT_ID="prj_VYHkd4rkcpzpeCT9qTBI0w1OC45A"
PROJECT_NAME="agent-gateway"
TEAM_ID="team_gpvntVuvgulKYbPElyfplj50"
TEAM_SLUG="themuulns-projects"
ENVIRONMENT="production"
BASE_URL="https://opencode.ai/zen/go/v1"
MODEL="mimo-v2.5"
NO_REDEPLOY=false
ROTATE_ENCRYPTION_KEY=false

usage() {
  cat <<'EOF'
Usage: configure-production-env.sh [options]

Options:
  --model MODEL              OpenCode Go model (default: mimo-v2.5)
  --no-redeploy              Update env vars only
  --rotate-encryption-key    Replace META_TOKEN_ENCRYPTION_KEY (invalidates old encrypted tokens)
  -h, --help                 Show this help

The OpenCode key is read from OPENCODE_API_KEY or a hidden prompt.
The key and generated encryption value are never printed.
EOF
}

while (($# > 0)); do
  case "$1" in
    --model)
      [[ $# -ge 2 ]] || { echo "Missing value for --model" >&2; exit 2; }
      MODEL="$2"
      shift 2
      ;;
    --no-redeploy)
      NO_REDEPLOY=true
      shift
      ;;
    --rotate-encryption-key)
      ROTATE_ENCRYPTION_KEY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
command -v vercel >/dev/null || { echo "vercel CLI is required" >&2; exit 1; }
command -v agent-pass >/dev/null || { echo "agent-pass is required" >&2; exit 1; }

VERCEL_TOKEN="$(agent-pass show zuiio/vercel/zerone)"
export VERCEL_TOKEN

if [[ -z "${OPENCODE_API_KEY:-}" ]]; then
  printf 'OpenCode API key (hidden): ' >&2
  read -r -s OPENCODE_API_KEY
  printf '\n' >&2
fi
[[ -n "$OPENCODE_API_KEY" ]] || { echo "OpenCode API key is required" >&2; exit 2; }

API="https://api.vercel.com"
AUTH=(-H "Authorization: Bearer $VERCEL_TOKEN")
JSON_HEADERS=(-H "Content-Type: application/json")
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

get_envs() {
  curl -fsS "${API}/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" "${AUTH[@]}"
}

upsert_env() {
  local key="$1"
  local value="$2"
  local type="${3:-encrypted}"
  local envs id payload response

  envs="$(get_envs)"
  id="$(jq -r --arg key "$key" --arg target "$ENVIRONMENT" \
    '.envs[] | select(.key == $key and (.target | index($target))) | .id' \
    <<<"$envs" | head -n 1)"

  payload="$(jq -n \
    --arg key "$key" \
    --arg value "$value" \
    --arg type "$type" \
    --arg environment "$ENVIRONMENT" \
    '{key:$key, value:$value, type:$type, target:[$environment]}')"
  printf '%s' "$payload" > "$TMP_DIR/payload.json"

  if [[ -n "$id" && "$id" != "null" ]]; then
    response="$(curl -fsS -X PATCH "${API}/v9/projects/${PROJECT_ID}/env/${id}?teamId=${TEAM_ID}" \
      "${AUTH[@]}" "${JSON_HEADERS[@]}" --data-binary @"$TMP_DIR/payload.json")"
  else
    response="$(curl -fsS -X POST "${API}/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" \
      "${AUTH[@]}" "${JSON_HEADERS[@]}" --data-binary @"$TMP_DIR/payload.json")"
  fi

  jq -e '.error == null' >/dev/null <<<"$response" || {
    echo "Vercel rejected ${key}" >&2
    jq -r '.error.message // .error.code // "unknown error"' <<<"$response" >&2
    exit 1
  }
  echo "Updated ${key} (${ENVIRONMENT})"
}

envs="$(get_envs)"
encryption_exists="$(jq -r --arg key META_TOKEN_ENCRYPTION_KEY --arg target "$ENVIRONMENT" \
  '[.envs[] | select(.key == $key and (.target | index($target)))] | length' <<<"$envs")"

if [[ "$encryption_exists" == "0" || "$ROTATE_ENCRYPTION_KEY" == true ]]; then
  encryption_key="$(openssl rand -hex 32)"
  upsert_env META_TOKEN_ENCRYPTION_KEY "$encryption_key" encrypted
else
  echo "Preserved existing META_TOKEN_ENCRYPTION_KEY"
fi

upsert_env OPENCODE_API_KEY "$OPENCODE_API_KEY" encrypted
upsert_env OPENCODE_BASE_URL "$BASE_URL" plain
upsert_env OPENCODE_MODEL "$MODEL" plain

if [[ "$NO_REDEPLOY" == true ]]; then
  echo "Environment updated. Redeploy skipped."
  exit 0
fi

deployment_url="$(curl -fsS "${API}/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1" "${AUTH[@]}" \
  | jq -r '.deployments[0].url // empty')"
[[ -n "$deployment_url" ]] || { echo "Could not find latest deployment" >&2; exit 1; }

echo "Redeploying ${PROJECT_NAME} (${TEAM_SLUG})"
vercel redeploy "https://${deployment_url}" --scope "$TEAM_SLUG" --token "$VERCEL_TOKEN"
echo "Done. Verify: curl -fsS https://agent.zuiiotech.com/api/health"
