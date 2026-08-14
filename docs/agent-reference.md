# Zuiio — Agent Reference

Reference material for agents. Load only when relevant; not injected by default.

## Local Supabase

Supabase local dev runs via colima (Docker alternative, no Docker Desktop):
```bash
colima start --cpu 4 --memory 8    # If not running
supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta  # ~2 min
supabase status                     # Check it's up
supabase stop                       # When done
```

---

### Working on an app
- **Zuiio ID** → `apps/archive/zuiio-id/AGENTS.md` (standalone repo `themuuln/zuiio-id`)
- **Zer** → `apps/archive/zer/AGENTS.md` (standalone repo `themuuln/zer`)
- **Tolom** → `apps/archive/tolom/AGENTS.md` (standalone repo `themuuln/tolom`)
- **Agent Gateway** → `apps/agent-gateway/AGENTS.md`
- **Website** → `apps/archive/website/AGENTS.md` (standalone repo `themuuln/website`)
- **Onoo** → `apps/onoo/AGENTS.md`
- **Tamga** → `apps/tamga/AGENTS.md`
- **Tumurch** → `apps/tumurch/AGENTS.md`
- **Khosuud** → `apps/khosuud/AGENTS.md`
- **Zim** → `apps/zim/AGENTS.md`
- **Zerbu** → `apps/zerbu/AGENTS.md`
- **Zer App** → `apps/zer-app/AGENTS.md`
- **Tolom Mobile** → `apps/tolom-mobile/AGENTS.md`
- **Tamga Web** → `apps/tamga-web/AGENTS.md`
- **Zraf Web** → `apps/zraf-web/AGENTS.md`
- **Tumurch RN** → `apps/archive/tumurch-rn/AGENTS.md` (standalone repo `themuuln/tumurch-rn`)

### Working on a package
- **@zuiio/core** → `packages/core/AGENTS.md`
- **@zuiio/hooks** → `packages/hooks/AGENTS.md`
- **@zuiio/query** → `packages/query/AGENTS.md`
- **@zuiio/ui** → `packages/ui/AGENTS.md`
- **@zuiio/realtime** → `packages/realtime/AGENTS.md`
- **@zuiio/offline** → `packages/offline/AGENTS.md`
- **@zuiio/hr** → `packages/hr/AGENTS.md`
- **@zuiio/export** → `packages/export/AGENTS.md`
- **@zuiio/capture** → `packages/capture/AGENTS.md`
- **@zuiio/ai-agent** → `packages/ai-agent/AGENTS.md`
- **@zuiio/branding** → `packages/branding/AGENTS.md`
- **@zuiio/config** → `packages/config/AGENTS.md`
- **@zuiio/auth** → `packages/auth/AGENTS.md`
- **@zuiio/oidc** → `packages/oidc/AGENTS.md`
- **@zuiio/i18n** → `packages/i18n/AGENTS.md`
- **@zuiio/supabase** → `packages/supabase/AGENTS.md`
- **@zuiio/search** → `packages/search/AGENTS.md`
- **@zuiio/sdk** → `packages/sdk/AGENTS.md`

---

### Commands

```bash
# One-off — use for a single command
v-tolom deploy
v-themuuln6 deploy
s-yesprice projects list

# Session switch — use before a block of commands
as-tolom        # sets both Vercel + Supabase to tolom's accounts
v whoami        # themulnofficial-9829
v deploy

as-zerone       # switch back to default
v whoami        # themuuln
```

### Per-app mapping

Source of truth: `.cli-profiles.json` (machine-readable) + this table (human-readable). Supabase accounts are `themuuln<N>` + `yesprice` — **one token per account, not per project** (a Supabase access token is account-scoped).

| Supabase account | Products | Supabase refs |
|---|---|---|
| yesprice | zer | `krrkhozadforrydffegg` ✅ confirmed (org "themuuln", Tokyo) |
| themuuln4 | tolom, tolom-mobile, damjuulagch | tolom `fhzuolncswccxkcqzclg` ✅ (Singapore) · damjuulagch `agpthoyxdfbkqcwypcuq` ✅ (Seoul) |
| themuuln1 | tamga, tamga-web, zunch (org only, no project) | tamga **`xwgcdqpunsuuxbyqbqik`** ✅ (Seoul) — `dgoqhlcqhpabbthamtrj` was a dead ref (400 removed) · sandbox `sfgfiztvnnizjhrlhsyd` |
| themuuln0 | zatly, zargo, zuch | zatly **`ijeuxmgktfqtukpmnenh`** ✅ (Singapore) · zargo `qikjhzxnaztfmmnxlyed` (Singapore) · zuch `stltvwanqlrelmkfguht` (Sydney) — **user: zuch = tamga** ⚠️ (older/other tamga? see themuuln1 row) |
| themuuln2 | tumurch, zraf | tumurch `oxnvbgdlhrgzzuyrnebf` ✅ (Tokyo) · zraf `lfapdupkwzznsbqjvnyc` ✅ (Tokyo) |
| themuuln3 | naadam, khosuud | naadam `ragiqcisavdryiqckrrb` ✅ · khosuud `rjzrnuddfjwbmxacclga` ✅ |
| themuuln11 | zurhaich (org "Zurhaich", project "Astrology") | zurhaich `iwokuddobkrzegauxkpy` ✅ (Tokyo) · ⚠️ **second zatly project** `bjjmykvmxiwhttotkrxo` (Tokyo) — `.env.local` + user mapping use themuuln0's `ijeuxmgk…`; confirm which is live |
| themuuln6 | zuiio-id, sso | zuiio-sso **`qjezndzwgoqmsduvzfqa`** ✅ (Singapore) — this is org `vvkksezoffientiyupqk`, the old "zuiio" org; serves zuiio-id auth too (no separate zuiio-id project) |
| themuuln7 | black-yak | black-yak **`jkwvsehoszxnddoenrdf`** ✅ (Seoul) |
| zuiio (org "Onoo") | onoo, zim | onoo `iyhujghadlymroihxyiy` ✅ (Singapore) · zim `cvqwdscitkpwlwnpajjd` (INACTIVE) — token found in pass `zuiio/onoo/supabase/cli` |

**Vercel side** (swept 2026-08-07 via REST API, tokens in pass `zuiio/vercel/*`):

| Vercel account | pass token | Projects |
|---|---|---|
| themuuln (zerone) | `zuiio/vercel/zerone` | onoo, onoo-staging, onoo-docs, tani, zer, tolom*, agent-gateway (agent.zuiiotech.com), tamga, damjuulagch, zargo, zraf-web, black-yak-adventure, zuiio-website, zuiio, tol, ott-web, unegui-deals, + ~35 experiments |
| themulnofficial-9829 | `zuiio/vercel/tolom` | tolom, zuiio-tolom, zuiio, zuiio-zer |
| themuuln6-3708 | `zuiio/vercel/themuuln6` | zuiio-id |
| yespricemn-5678 | `zuiio/vercel/yesprice` | zer |
| (dup of themulnofficial-9829) | `zuiio/vercel/themuln.official` | same 4 as tolom — duplicate token, keep only if the email login is used |

Notes: `tolom` exists on BOTH zerone and themulnofficial-9829 — the live one per `.cli-profiles.json` is themulnofficial-9829 (v-tolom). zatly has no Vercel (self-hosted). onoo's Supabase = `zuiio` profile (org Onoo).

**`supa` profiles — one per Supabase account (10/10 registered ✅):** `yesprice`, `themuuln0`, `themuuln1`, `themuuln2`, `themuuln3`, `themuuln4`, `themuuln6`, `themuuln7`, `themuuln11`, `zuiio`. Tokens in pass `zuiio/supabase/*` (agent-pass readable). Every project ref above is confirmed via `projects list`.

### Troubleshooting

- Vercel tokens are stored in `~/.cache/zsh/tokens.zsh` (`__v_<account>`) and loaded via `.zshrc` `__lazy_load_secrets`
- Supabase tokens are stored per account in `~/.cache/zsh/supabase-tokens.sh` (`__sb_<account>`), injected as `SUPABASE_ACCESS_TOKEN` by the `s-<app>` / `as-<app>` aliases
- The native keychain is NOT used on this machine (headless keychain writes fail with "User interaction is not allowed"), and the CLI's `--profile` flag does not work here — it always falls back to `~/.supabase/access-token`
- `~/.supabase/access-token` holds one legacy token (last `supabase login`); plain `supabase` without an alias uses it
- If a token is missing: add the account's token to `~/.cache/zsh/supabase-tokens.sh` (get it from `https://supabase.com/dashboard/account/tokens` or copy from `~/.supabase/access-token` right after `supabase login`), then `source ~/.zshrc`
- Check with `v-<name> whoami` or `s-<app> projects list`
- Vercel tokens: pass `zuiio/vercel/<name>` (agent-pass readable — allowlist is `zuiio/*`), loaded at shell start via `.zshrc` token cache.
- Supabase multi-account: use **`supa`** (`~/.local/bin/supa`, github.com/themuuln/supabase-profiles) — the official CLI's `--profile` silently falls back to one keychain token in headless contexts, which makes per-account work lie. `supa login <profile> --token sbp_...` then `supa run <profile> <cmd>` injects the right token per command. Tokens are plaintext in `~/.config/supa/profiles.json` (mode 600).
- Pass structure rule: `zuiio/` = project secrets (agent-readable via `agent-pass`); `personal/`, `work/` = private, denied.
- If a profile is missing: run `source ~/.zshrc` then check with `v-<name> whoami` or `supa run <name> projects list`.

---

### Vercel error logs

Filter by error level, status code, time range, environment, or deployment. Always use the correct profile alias.

```bash
# Last 2 hours of errors for a project
v logs --project onoo --level error --since 2h

# 500 errors as JSON (pipe to jq for analysis)
v logs --project onoo --status-code 500 --json

# Production errors with full messages
v logs --project onoo --environment production --level error --expand

# Specific deployment
v logs dpl_xxxxx --level error

# Live follow (stream as requests come in)
v logs --project onoo --level error --follow

# Edge function errors
v logs --project onoo --source edge-function --level error --since 1h

# Tolom (different Vercel account)
v-tolom logs --project tolom --level error --since 2h
```

**When to use:** 500 errors, function crashes, timeouts, build failures, unexpected API behavior in production.

### Supabase logs (via MCP)

Use the Supabase MCP `get_logs` tool to fetch logs by service type. Returns last 24 hours.

| Service | What it shows |
|---------|---------------|
| `api` | PostgREST API request logs |
| `postgres` | Database query errors, slow queries |
| `auth` | Login failures, rate limits, JWT errors |
| `storage` | File upload/download errors |
| `edge-function` | Edge Function execution logs |
| `realtime` | Realtime subscription errors |

Usage from the agent:
```json
// Fetch auth errors (rate limits, login failures)
write xd://mcp__supabase_onoo_get_logs { "service": "auth" }

// Fetch database errors
write xd://mcp__supabase_onoo_get_logs { "service": "postgres" }
```

**When to use:** Auth 429 rate limits, database query failures, RLS policy violations, storage access errors.

### Debugging workflow

1. **Identify the symptom** — user reports an error, you see a toast/console error
2. **Check Vercel logs** — `v logs --project <app> --level error --since 2h`
3. **Check Supabase logs** — corresponding service (auth/postgres/api)
4. **Correlate** — match request IDs or timestamps across both to find root cause
5. **Fix** — apply the fix, verify with a second log check

---

