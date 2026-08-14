# GAPS — Production readiness (FB page → AI agent → Supabase product info)

Last updated: 2026-08-07. Session: zer + agent-gateway production-readiness pass.

## Status

Code is implemented, tested, and green on both gates. Remaining items below are
deploys, Meta-side settings, and content. Nothing in this file is a code
blocker.

## Must do before launch

### 1. Deploy both apps (needs owner approval)

- `apps/agent-gateway` → Vercel production (root dir `apps/agent-gateway`)
- `zer` (standalone repo `themuuln/zer`) → Vercel production

### 2. Environment variables

**agent-gateway (Vercel):**

| Var | Purpose |
|---|---|
| `FB_APP_ID` | Meta App ID (server-side; also set `NEXT_PUBLIC_FACEBOOK_APP_ID` for the SDK loader) |
| `FB_APP_SECRET` | Meta App Secret (HMAC webhook signature + token exchange) |
| `FB_VERIFY_TOKEN` | Webhook `hub.verify_token` — MUST match the value entered in Meta's webhook config |
| `FB_OAUTH_REDIRECT_URI` | `https://<gateway>/api/facebook/callback` — must be registered in the Meta app |
| `META_TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for page/user tokens at rest. **Without it tokens store as plaintext** (degradation warning in `src/lib/crypto.ts`) |
| `FB_RETURN_URL_ZER` | Where the user lands after page connect (e.g. `https://zer.mn/settings`) |
| `FB_RETURN_URL_TOLOM` | Same for tolom (optional) |

**zer (Vercel):**
- `AGENT_GATEWAY_URL`, `AGENT_GATEWAY_API_SECRET` — server-side; must match the
  gateway's `AGENT_GATEWAY_API_SECRET`. The Telegram/Facebook settings flows
  401 without them (server actions fail closed).

### 3. Meta platform (per `apps/agent-gateway/docs/FACEBOOK_INSTAGRAM_PLAN.md`)

- Page webhook subscribed (`messages` + `messaging_postbacks` fields) via
  `POST /{page_id}/subscribed_apps` — the connect flow does this automatically
  at page select; verify after first connect.
- Advanced access for `pages_messaging`, `pages_show_list` (and
  `pages_manage_metadata`, `instagram_basic`, `instagram_manage_messages` for
  IG).
- **Blocked on Meta**: Business Verification (~14 business days) then App
  Review (~3–7 days). Until approved, only test users/pages work. This was
  pending as of 2026-08-06.

### 4. Product info / knowledge content

- Agent answers product questions from the live `products` table via the
  `searchProducts` tool (customer audience, zer). No action needed for this.
- `agent_knowledge_sources` is EMPTY in prod. Add org business info (FAQ,
  policies, hours) via `POST /api/dashboard/kb` (Bearer `DASHBOARD_SECRET`).
  There is no KB management UI yet — only the API.

## Known non-blockers

- `apps/agent-gateway`: 77 pre-existing biome warnings (`noNonNullAssertion`) —
  warnings only, gate passes (exit 0).
- zer `test:unit` (tsx `tests/*.test.ts`) not re-run in this session (untouched
  by the changes; commit gate covers it).
- `channel_connections` rows created before 2026-08-07 lack
  `metadata.user_access_token`, so the refresh cron skips them (`skipped`)
  until the page is reconnected.
- `apps/agent-gateway/docs/PRODUCTION.md` says "Zer migration not applied" —
  stale; verified live: `channel_connections`, `agent_knowledge_sources`,
  `agent_sessions` all exist in the shared zer Supabase project.

## Fixed this session (reference)

- **zer**: browser→gateway `/api/link/code` call was unauthenticated → always
  401. Now proxied via `getTelegramLinkCode()` server action
  (`settings/telegram-actions.ts`). Dead `telegram-link.tsx` removed.
- **agent-gateway**: quick-reply events processed twice (text + payload) —
  exclusive dispatch in `facebook/webhook/route.ts`.
- **agent-gateway**: Meta page-token refresh was broken (fb_exchange_token on
  page token). Now: user token stored at connect
  (`metadata.user_access_token`), cron refreshes user token → `/me/accounts` →
  page token (`cron/refresh-meta-tokens/route.ts`).
- **agent-gateway**: customer tool set now includes read-only `searchProducts`
  (zer) — org-scoped, no `cost_price`/`min_stock`, limit 1–10
  (`gateway/customer-product-tool.ts`). Removed dead-broken
  `FacebookProvider.connectPage`.
- Fixed latent tsc errors in `webhook-helpers.ts` (supabase-js to-one embeds
  typed as arrays).

## Verification evidence

- agent-gateway: `tsc --noEmit --incremental` ✅ · `biome check` exit 0 ✅ ·
  `vitest run` → 119 files / 1142 tests ✅
- zer: `pnpm turbo run typecheck lint test:coverage --filter=zer --continue` →
  6/6 tasks ✅
- Live DB (supabase-zer): all gateway tables present; `products` columns
  verified; org-scoped search dry-run returns rows ✅
