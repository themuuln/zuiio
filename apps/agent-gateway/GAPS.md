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

- Business Verification: **APPROVED** (2026-08-25, per owner). Advanced
  access for the permissions below must still be requested in the Meta app
  (App Review) before public pages work — until then only test users/pages.
- Required advanced access now includes, beyond `pages_messaging` /
  `pages_show_list` / `pages_manage_metadata`:
  `pages_manage_engagement`, `pages_read_engagement`,
  `pages_read_user_content` (comment auto-reply agent).
- Page webhook subscribed (`messages` + `messaging_postbacks` + `feed`)
  — the connect flow requests all three via `subscribed_apps`; **the
  App-level webhook config in the Meta developer dashboard must also have
  the `feed` field checked for the Page object** (manual, one-time).
- Existing connected pages get `feed` re-asserted by
  `cron/refresh-meta-tokens` at their next token refresh (≤60 days); to
  enable comment replies sooner, reconnect the page once.
- Instagram comment replies are NOT implemented — IG comments arrive on the
  `instagram` webhook object (separate subscription), not the Page `feed`.

### 4. Product info / knowledge content

- Agent answers product questions from the live `products` table via the
  `searchProducts` tool (customer audience, zer). No action needed for this.
- `agent_knowledge_sources` is EMPTY in prod. Add org business info (FAQ,
  policies, hours) via `POST /api/dashboard/kb` (Bearer `DASHBOARD_SECRET`).
  There is no KB management UI yet — only the API.


## Full-Potential Backlog — Ranked New Ideas (2026-08-27 research)

| Rank | Idea | Impact / Effort | Permission or field | What it's for (short Mongolian/English purpose) |
|---:|---|---|---|---|
| 1 | Referral-triggered starter flows — **SHIPPED** ([migration](supabase/migrations/20260828000000_referral_events.sql); referral_events + webhook) | High/Low | `messaging_referrals` | attribute m.me ref/Ad QR → starter flow not generic greeting |
| 2 | Unified human inbox (human takeover/return-to-AI) | High/Medium | `standby`, `messaging_handovers` | sales/support 24h chats without history loss |
| 3 | IG comments → Private Reply DMs | High/Low | `instagram.comments` | 7-day comment→DM window |
| 4 | Persistent menu + Ice Breakers (4 FAQ chips) | High/Low | `messaging_postbacks` | always-visible entry points |
| 5 | Consent-aware sequences/broadcasts | High/Medium | opt-in/notification fields | legal outside-24h follow-ups |
| 6 | Messenger/IG account linking | High/Medium | `messaging_account_linking` | prove PSID = Zer/Tolom user → org actions |
| 7 | Zer inventory product carousel | High/Medium | catalog/product perms | tappable cards vs text links |
| 8 | Segment + A/B funnel analytics | Medium/Medium | existing fields | which flow/copy converts |
| 9 | Message echo reconciliation | Medium/Low | `message_echoes` | absorb manual Page replies, avoid dupe |
| 10 | Mongolian vertical templates (repair/beauty/retail) | ✅ Available | `/api/dashboard/templates` GET lists templates; POST clones one into an org's active `flow_versions` | faster onboarding |
| 11 | Conversation-Ad ROI dashboard | High/High | referral + ads perms | ad click → lead → Zer order |
| 12 | Knowledge-grounded escalation | High/Medium | existing scopes | low-confidence → human SLA queue |
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
