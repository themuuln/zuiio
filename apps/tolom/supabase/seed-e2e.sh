#!/usr/bin/env bash
# Seed the local Supabase instance with the E2E test user.
# Run after `supabase start` and before `pnpm test:e2e`.
#
# Usage:
#   ./supabase/seed-e2e.sh
#
# Environment variables (all have defaults):
#   E2E_EMAIL    — test user email
#   E2E_PASSWORD — test user password
#   E2E_PIN      — org selection PIN (default: 1234)

set -euo pipefail

EMAIL="${E2E_EMAIL:-themuuln4@gmail.com}"
PASSWORD="${E2E_PASSWORD:-Tolom!11}"
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
SUPABASE_HOST=$(python3 -c 'from urllib.parse import urlparse; import sys; print(urlparse(sys.argv[1]).hostname or "")' "$SUPABASE_URL")
case "$SUPABASE_HOST" in
  localhost|127.0.0.1|::1) ;;
  *)
    echo "❌ E2E seeding only permits a local Supabase URL."
    exit 1
    ;;
esac
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Resolve service role and anon keys from the local Supabase status output.
if [ -z "$SERVICE_ROLE_KEY" ]; then
  SERVICE_ROLE_KEY=$(supabase status --output json 2>/dev/null | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("SERVICE_ROLE_KEY") or data.get("service_role_key") or "")' 2>/dev/null || echo "")
fi
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(supabase status --output json 2>/dev/null | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("ANON_KEY") or data.get("anon_key") or "")' 2>/dev/null || echo "")
fi

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "⚠️  Could not resolve service role key. Run 'supabase start' first."
  exit 1
fi

# Check if user already exists
EXISTING=$(curl -s \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/auth/v1/admin/users?email=$EMAIL" \
  | python3 -c "import sys,json; users=json.load(sys.stdin).get('users',[]); print(len(users))" 2>/dev/null || echo "0")

if [ "$EXISTING" != "0" ]; then
  echo "✅ Test user $EMAIL already exists — skipping."
  exit 0
fi

# Create user via Supabase Admin API
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true
  }" \
  "$SUPABASE_URL/auth/v1/admin/users")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  USER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','unknown'))" 2>/dev/null || echo "unknown")
  echo "✅ Created test user: $EMAIL (id: $USER_ID)"
else
  echo "❌ Failed to create test user (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
