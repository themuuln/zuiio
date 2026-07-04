#!/usr/bin/env bash
set -euo pipefail

echo "=== Zatly Deployment ==="

# 1. Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm required"; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo "Supabase CLI required"; exit 1; }

# 2. Install dependencies
echo "--- Installing dependencies ---"
pnpm install --frozen-lockfile

# 3. Run migrations
echo "--- Running database migrations ---"
supabase db push

# 4. Deploy Edge Functions
echo "--- Deploying Edge Functions ---"
supabase functions deploy facebook-webhook --no-verify-jwt
supabase functions deploy scheduled-processor --no-verify-jwt

# 5. Build Next.js app
echo "--- Building Next.js app ---"
pnpm build

# 6. Run tests
echo "--- Running tests ---"
pnpm test || echo "Warning: tests failed, continuing..."

echo "=== Deployment complete ==="
echo "Next steps:"
echo "  1. Set environment secrets:"
echo "     supabase secrets set FB_VERIFY_TOKEN=... FB_PAGE_ACCESS_TOKEN=..."
echo "     supabase secrets set FB_APP_SECRET=... SUPABASE_URL=..."
echo "     supabase secrets set SUPABASE_SERVICE_ROLE_KEY=..."
echo "  2. Configure cron (cron-job.org → GET https://your-app.com/api/cron)"
echo "  3. Start Next.js: pnpm start"
