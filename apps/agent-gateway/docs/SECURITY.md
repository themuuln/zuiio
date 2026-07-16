# Security Model

Agent Gateway is a multi-tenant system where organizations share infrastructure but must never access each other's data. This document describes the security invariants, threat model, and hardening measures.

## Core Invariant

**The gateway resolves `orgId` from the database, never from LLM output.**

The LLM can generate any text, including requests for other organizations' data. The gateway ignores LLM-provided org identifiers and uses the value resolved from the `telegram_links` or `custom_bots` table.

```
Untrusted input                Trusted resolution
─────────────                  ──────────────────
User message ──────┐
                   │
LLM response ──────┼──▶ Gateway ignores LLM orgId
                   │
Telegram user ─────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Link table       │
              │ (orgId resolved) │
              └────────┬────────┘
                       │
                       ▼
              Tool receives trusted orgId
              Tool filters ALL queries by orgId
```

## Threat Model

### 1. Cross-Tenant Data Leakage

**Risk:** One organization's data visible to another.

**Mitigations:**
- `orgId` resolved from DB, never trusted from user/LLM input
- Every tool query includes `.eq("organization_id", orgId)`
- Supabase service-role client bypasses RLS — application-level filtering is the only guard
- `securityAudit()` verifies env config at startup

**Residual risk:** A bug in any tool that omits the orgId filter would leak data. The `withAudit()` wrapper logs all tool calls for post-hoc detection.

### 2. Prompt Injection

**Risk:** User crafts input that tricks the LLM into ignoring tools or leaking data.

**Mitigations:**
- `sanitizeUserInput()` strips control characters and caps length (2000 chars)
- `sanitizeDisplayName()` strips injection-prone characters from Telegram names
- `sanitizeDbError()` returns generic messages — no schema/table/column names exposed
- System prompt includes group chat warning: never share personal data in group contexts
- Tool results are truncated to prevent context window overflow

**Residual risk:** Sophisticated prompt injection can still manipulate LLM behavior within the tool-call space. The confirmation gate for write tools provides a human-in-the-loop backstop.

### 3. Unauthorized Webhook Calls

**Risk:** Attacker sends fake updates to the webhook endpoint.

**Mitigations:**
- `TELEGRAM_WEBHOOK_SECRET` validated via `X-Telegram-Bot-Api-Secret-Token` header
- `isAuthorizedTelegramRequest()` checks the header before processing
- Telegram's `setWebhook` `secret_token` parameter ensures only Telegram sends updates

### 4. Token Forgery

**Risk:** Attacker forges a link token to impersonate a user.

**Mitigations:**
- HMAC-SHA256 signature with `TOKEN_SIGNING_SECRET`
- 15-minute expiry built into the token payload
- Payload is binary-packed (37 bytes → 63 char token) — not human-readable
- `verifyCompactToken()` validates signature and expiry before accepting

### 5. Rate Limit Bypass

**Risk:** Attacker sends excessive requests to exhaust resources or budget.

**Mitigations:**
- Sliding-window rate limiter per org (20 messages/min)
- Daily token budget per org (1M hard cap)
- Link request rate limit (10/min)

**Residual risk:** In-memory rate limiting doesn't work across serverless instances. Multiple cold-started instances each have their own window. For production-grade limiting, use Redis or Postgres advisory locks.

### 6. Service Role Abuse

**Risk:** Tool queries with service-role privileges access data outside the org.

**Mitigations:**
- Every tool MUST filter by `orgId` — this is a code convention enforced by review
- `withAudit()` logs every tool call with orgId, tool name, and args
- `agent_audit_log` table provides a permanent audit trail
- Tolom uses a separate Supabase project — no cross-project access possible

## Security Controls by Layer

| Layer | Control | Implementation |
|---|---|---|
| **Webhook** | Secret token validation | `isAuthorizedTelegramRequest()` |
| **Input** | Sanitization | `sanitizeUserInput()`, `sanitizeDisplayName()` |
| **Auth** | Org resolution from DB | `resolveOrgFromChatUser()`, `resolveOrgFromBotKey()` |
| **Rate** | Sliding window | `checkRateLimit()` — 20 req/min per org |
| **Budget** | Daily token cap | `checkDailyBudget()` — 1M tokens/day per org |
| **Tools** | OrgId filtering | Every query includes `.eq("organization_id", orgId)` |
| **Write tools** | Confirmation gate | `stageAction()` → inline keyboard → `confirmAction()` |
| **Output** | Error genericization | `sanitizeDbError()` — no raw DB errors |
| **Audit** | Tool call logging | `withAudit()` → `agent_audit_log` |
| **Startup** | Config validation | `securityAudit()` checks env vars |

## Environment Security

See [ENVIRONMENT.md](ENVIRONMENT.md) for the full variable reference. Key security requirements:

- `TOKEN_SIGNING_SECRET` — ≥16 chars, not a known default
- `TELEGRAM_WEBHOOK_SECRET` — random, ≥32 chars
- `SUPABASE_SERVICE_ROLE_KEY` — never exposed to client-side
- All secrets stored in deployment platform env vars, never in code

## Production Checklist

Before deploying to production:

- [ ] `securityAudit()` returns no warnings
- [ ] `TOKEN_SIGNING_SECRET` is a strong random value (not the dev default)
- [ ] `TELEGRAM_WEBHOOK_SECRET` is set and matches `setWebhook` call
- [ ] `SUPABASE_URL` points to the real project (not placeholder)
- [ ] Webhook is registered with `secret_token` parameter
- [ ] HTTPS is enforced on the webhook URL
- [ ] `AGENT_READER_PASSWORD` is set for the read-only Supabase role

## Known Limitations

1. **In-memory state** — Rate limiter and staged actions don't persist across serverless cold starts. Acceptable for current scale; would need Redis for multi-region consistency.

2. **Service-role access** — Tools bypass RLS. A single missing `orgId` filter in a tool would leak data. Mitigated by audit logging but not prevented at the framework level.

3. **Session storage** — Conversation history is stored in Supabase with a 24h TTL. No encryption at rest beyond Supabase's defaults.

4. **Confirmation gate** — Write tool confirmation is in-memory. If the server restarts between staging and confirmation, the staged action is lost.
