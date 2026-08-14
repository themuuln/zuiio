# Deployment Checklist — Zer

## Pre-Deploy

### Environment Variables

Verify all required env vars are set in Vercel dashboard. Source of truth: `.env.local` and `src/lib/supabase/env.ts`.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role (server-only) |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | Sentry error tracking (client) |
| `SENTRY_DSN` | ✅ | Sentry server-side DSN |
| `SENTRY_AUTH_TOKEN` | ⚠️ | Only needed for source map upload |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Production URL (e.g., `https://zuiio.mn`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Cloudflare Turnstile (auth form bot protection) |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | ✅ | Turnstile server-side verification |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram notifications |
| `TELEGRAM_WEBHOOK_SECRET` | Optional | Telegram webhook verification |
| `CRON_SECRET` | ✅ | Cron job authentication |
| `DEEPSEEK_API_KEY` | Optional | AI agent gateway |

Cloudflare R2 and Workers AI vars (see `.env.example`) are optional — only needed for file uploads and edge inference.

### Database

- [ ] All migrations applied: `supabase migration list`
- [ ] Types regenerated: `supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
- [ ] New tables have RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] New RPCs have `GRANT EXECUTE TO authenticated`

### Code Quality

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (biome + capture-check)
- [ ] `pnpm test` passes
- [ ] No bare `console.error` in catch blocks — use `capture()` from `@sentry/nextjs`
- [ ] All Supabase server queries use `withDbCapture()` for error observability

## Deploy

### Vercel

1. Push to `main` branch
2. Vercel auto-deploys
3. Check build logs for errors
4. Verify source maps uploaded to Sentry (if `SENTRY_AUTH_TOKEN` is set)

### Post-Deploy Verification

1. [ ] Health endpoint: `GET /api/health` returns `{ status: "healthy" }`
2. [ ] Login works (Turnstile challenge should appear on auth forms)
3. [ ] Dashboard loads
4. [ ] Sentry receives test error (if configured)

### Cron Setup

The daily report cron must be registered after each deploy. It calls `schedule_daily_report_cron` in Supabase to set up pg_cron scheduling.

```bash
curl -X GET https://<app-url>/api/cron/setup \
  -H "Authorization: Bearer <CRON_SECRET>"
```

> **Easy to forget.** Without this, the daily Telegram reports and email summaries won't run.

To unschedule:

```bash
curl -X DELETE https://<app-url>/api/cron/setup \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## Rollback

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click **"Promote to Production"**

## Monitoring

- **Errors**: Sentry dashboard at sentry.io
- **Uptime**: Monitor `/api/health` endpoint
- **Logs**: Vercel dashboard → Logs
