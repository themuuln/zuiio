#!/bin/bash
# Onoo Demo Setup Script
# Run after `supabase db reset` to create working auth users via GoTrue API
# Usage: bash scripts/setup-demo.sh

set -uo pipefail

API_URL="http://127.0.0.1:54325"
ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
SERVICE_KEY=$(grep SERVICE_ROLE_KEY .env.local | cut -d= -f2)
PG_URL="postgresql://postgres:postgres@127.0.0.1:54323/postgres"

echo "=== Creating demo users via GoTrue API ==="

clean_user() {
  local email=$1
  local uid=$(psql "$PG_URL" -t -A -c "SELECT id FROM auth.users WHERE email='$email';" 2>/dev/null)
  if [ -n "$uid" ]; then
    echo "Cleaning existing user: $email ($uid)"
    psql "$PG_URL" -c "UPDATE public.team_staff SET user_id = NULL WHERE user_id = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.academy_enrollments SET created_by = NULL WHERE created_by = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.announcements SET created_by = NULL WHERE created_by = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.student_payments SET recorded_by = NULL WHERE recorded_by = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.stat_events SET created_by = NULL WHERE created_by = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.tracker_sessions SET scorer_id = NULL WHERE scorer_id = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "UPDATE public.awards SET granted_by = NULL WHERE granted_by = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "DELETE FROM public.memberships WHERE user_id = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "DELETE FROM public.profiles WHERE id = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "DELETE FROM auth.identities WHERE user_id = '$uid'::uuid;" 2>/dev/null || true
    psql "$PG_URL" -c "DELETE FROM auth.users WHERE id = '$uid'::uuid;" 2>/dev/null || true
  fi
}

clean_user "admin@onoo.mn"
clean_user "demo@onoo.mn"
clean_user "seed-admin@onoo-test.mn"

sleep 1

# Create users via GoTrue admin API
create_user() {
  local email=$1 password=$2
  local result=$(curl -sL -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true}" 2>&1)
  local id=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
  if [ -z "$id" ]; then
    echo "ERROR creating $email: $(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('msg','UNKNOWN'))" 2>/dev/null)"
    return 1
  fi
  echo "$email: $id"
  echo "$id"
}

ADMIN_ID=$(create_user "admin@onoo.mn" "Demo123!")
DEMO_ID=$(create_user "demo@onoo.mn" "Demo123!")

# Create profiles and memberships
if [ -n "$ADMIN_ID" ]; then
  psql "$PG_URL" -c "INSERT INTO public.profiles (id, display_name) VALUES ('$ADMIN_ID'::uuid, 'Админ') ON CONFLICT (id) DO NOTHING;"
  psql "$PG_URL" -c "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES
    ('$ADMIN_ID'::uuid, 'org', 'b0000000-0000-0000-0000-000000000002', 'owner'),
    ('$ADMIN_ID'::uuid, 'league', 'c0000000-0000-0000-0000-000000000001', 'admin'),
    ('$ADMIN_ID'::uuid, 'league', 'c0000000-0000-0000-0000-000000000002', 'admin')
  ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING;"
fi

if [ -n "$DEMO_ID" ]; then
  psql "$PG_URL" -c "INSERT INTO public.profiles (id, display_name) VALUES ('$DEMO_ID'::uuid, 'Демо Хэрэглэгч') ON CONFLICT (id) DO NOTHING;"
  psql "$PG_URL" -c "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES
    ('$DEMO_ID'::uuid, 'org', 'b0000000-0000-0000-0000-000000000002', 'viewer')
  ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING;"
fi

echo ""
echo "=== Verifying Login ==="
for email in admin@onoo.mn demo@onoo.mn; do
  result=$(curl -sL -X POST "$API_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Demo123!\"}" 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('SUCCESS' if d.get('access_token') else 'FAIL: '+d.get('msg',''))")
  echo "$email: $result"
done

echo ""
echo "=== Demo Data Summary ==="
psql "$PG_URL" -c "
SELECT 'players' as t, count(*) FROM public.players
UNION ALL SELECT 'teams', count(*) FROM public.teams
UNION ALL SELECT 'games', count(*) FROM public.games
UNION ALL SELECT 'academy_students', count(*) FROM public.academy_students
UNION ALL SELECT 'awards', count(*) FROM public.awards
UNION ALL SELECT 'stat_events', count(*) FROM public.stat_events
ORDER BY t;
" 2>/dev/null | grep -v "^$\|rows)"

echo ""
echo "Demo is ready!"
echo "  Login: admin@onoo.mn / Demo123! (admin)"
echo "  Login: demo@onoo.mn / Demo123! (viewer)"
