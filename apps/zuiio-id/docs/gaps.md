# Architecture Gaps — Zuiio ID

Extracted from the full architecture review on 2026-07-17.
Full report: [`ARCHITECTURE_AUDIT.md`](../ARCHITECTURE_AUDIT.md)

---

## 🔴 Critical (P0 — fix before production)

### C1. SAML ACS accepts forged assertions — complete auth bypass

`src/app/saml/acs/route.ts:18-38`

The SAML Assertion Consumer Service decodes `SAMLResponse` from base64, parses it with `fast-xml-parser`, but **never verifies the XML digital signature**. A comment acknowledges this ("simplified — production would use @node-saml/node-saml"), yet `@node-saml/node-saml` is in `package.json` but never imported. The ACS also ignores `InResponseTo`, enabling unsolicited assertion injection.

**Impact:** Any attacker can craft a base64-encoded SAML Response with an arbitrary email and POST it to `/saml/acs` to authenticate as any user.

**Fix:** Replace manual XML parsing with `@node-saml/node-saml`'s `postValidateSamlResponse()`. Remove `fast-xml-parser` from SAML paths.

**Effort:** 2-3 days

---

### C2. SCIM POST /Users deactivation logic is inverted

`src/app/api/scim/v2/Users/route.ts:147-149`

When SCIM creates a user with `active:false`, the code calls `updateUserById` with `ban_duration: 'none'` — which **removes** bans instead of banning. The `PUT` handler at `[id]/route.ts:163` correctly uses `ban_duration: '100y'`.

**Impact:** Users provisioned as inactive through SCIM POST are actually active. External IdPs deprovisioning via SCIM fail silently.

**Fix:** Change `ban_duration: "none"` to `ban_duration: "100y"`.

**Effort:** 5 minutes

---

### C3. Webhook admin endpoints lack authorization

`src/app/api/admin/webhooks/route.ts:33-68` (POST)
`src/app/api/admin/webhooks/[id]/route.ts:8-19` (DELETE)

POST checks `getUser()` but no admin role. DELETE has **no auth check at all** — any unauthenticated request can delete webhook subscriptions.

**Impact:** Any user can create webhook subscriptions for any `product_id` and delete any subscription by ID.

**Fix:** Add admin role check (via RBAC or direct query) to both handlers.

**Effort:** 1 day

---

### C4. HMAC continuation token comparison is timing-unsafe

`src/lib/auth/continuation.ts:66`

```typescript
// CURRENT — short-circuits on first differing byte
if (signature !== expectedSignature) { return null; }
```

Uses `!==` which short-circuits on the first differing character. Enables byte-by-byte HMAC signature guessing via timing side-channel.

**Fix:** Use `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))`.

**Effort:** 15 minutes

---

## 🟡 Important (P1 — fix this sprint)

### I1. Admin webhook POST lacks admin role check

`src/app/api/admin/webhooks/route.ts:33-68`

POST checks `getUser()` but no RBAC/admin check. Any authenticated user can create webhook subscriptions for any `product_id`.

**Fix:** Verify user has admin role in the target product's org.

---

### I2. OAuth decision endpoint uses getSession() instead of getUser()

`src/app/api/oauth/decision/route.ts:50-51`

Uses `supabase.auth.getSession()` which reads from cookies without server-side JWT validation. Consent decisions require verified sessions.

**Fix:** Replace `getSession()` with `getUser()`.

---

### I3. No cleanup mechanism for expired auth_continuations

`supabase/migrations/20260716090000_zuiio_id_schema.sql:170-179`

`auth_continuations` accumulates rows indefinitely. No `pg_cron`, no Edge Function, no app-level cleanup. `login_attempts` has `cleanupOldAttempts()` but `auth_continuations` has nothing.

**Fix:** Add pg_cron job to delete rows where `expires_at < now() - interval '1 day'`.

---

### I4. Webhook retry delivery recorded but never processed

`src/lib/webhooks.ts:115-148`

`handleFailedDelivery` stores `next_retry_at` timestamps and creates an index, but no background worker reads this index. Failed webhooks remain `pending` forever.

**Fix:** Implement pg_cron job or Supabase Edge Function for retry processing.

---

### I5. createAdminClient creates new client on every call with dynamic imports

`src/lib/supabase/server.ts:39-51`

Every call performs two dynamic imports and creates a new Supabase client. Called 5-7 times per request (rate limiting, RBAC, audit, webhooks). Under load, thousands of client instances per minute.

**Fix:** Use module-level singleton (safe in Node.js). Remove unnecessary dynamic imports.

---

### I6. No error tracking — all auth errors go to console.error

`src/app/(auth)/login/actions.ts:150-153`
`src/lib/supabase/audit.ts:40-52`

No Sentry, Datadog, or structured error tracking. `console.error` is ephemeral in Vercel serverless. Critical auth failures silently lost.

**Fix:** Add Sentry via `@zuiio/capture` workspace package.

---

### I7. No health check endpoints

No `/health`, `/healthz`, `/ready` endpoints exist. No application-level health check for DB connectivity, Supabase auth availability, or dependency readiness.

**Fix:** Add `/api/health` that verifies DB and Supabase reachability.

---

### I8. acceptInvite has TOCTOU race condition

`src/lib/organizations.ts:157-196`

Checks membership (select) then inserts (insert) in two separate queries with no transaction wrapper. Concurrent requests with the same invite token can both pass the membership check.

**Fix:** Use Supabase RPC function with single SQL statement.

---

### I9. createOrganization lacks transaction — orphan risk

`src/lib/organizations.ts:51-79`

Inserts into `organizations` then `org_memberships` as separate queries. If membership insert fails, orphan organization created with no owner.

**Fix:** Wrap both inserts in a Supabase RPC function with transaction.

---

### I10. SCIM GET /Users doesn't resolve email

`src/app/api/scim/v2/Users/route.ts:48-70`

Queries only `profiles` table (no email column). Returns all users with empty email strings. GET `/:id` correctly fetches email.

**Fix:** Join with `auth.users` via admin client or batch-fetch emails.

---

### I11. SCIM token stored in plaintext

`src/lib/products/catalog.ts:76-88`
Migration: `scim_token text unique`

Bearer tokens stored as plaintext. Database compromise exposes all tokens immediately.

**Fix:** Hash tokens at rest (SHA-256). Hash incoming token before comparison in `verifyScimToken`.

---

### I12. No rate limiting on API endpoints

`src/app/api/oauth/decision/route.ts`, `src/app/saml/acs/route.ts`, `src/app/api/scim/v2/`

Rate limiting applied only in login/forgot-password actions. OAuth consent, SCIM provisioning, SAML ACS, and webhook admin endpoints have none.

**Fix:** Apply rate limiting to OAuth consent and SCIM provisioning at minimum.

---

### I13. SAML ACS listUsers truncates at 1000

`src/app/saml/acs/route.ts:103-105`

Fallback uses `listUsers({page:1, perPage:1000})`. Beyond 1000 users, SAML login fails.

**Fix:** Implement paginated lookup or use direct DB query.

---

### I14. SCIM POST /Users skips validation

`src/app/api/scim/v2/Users/route.ts:130-135`

Accepts `userName`/`email` without validating against signup rules (format regex, reserved names, email format).

**Fix:** Reuse validation logic from signup actions.

---

## 🟢 Suggestions (P2+)

| # | Finding | File | Fix |
|---|---|---|---|
| S1 | SAML SLO picks first IdP, not user's actual IdP | `src/app/saml/slo/route.ts:43-45` | Track IdP via session cookie during ACS |
| S2 | `userHasPermission` makes 3 sequential DB round-trips | `src/lib/rbac.ts:116-149` | Consolidate into single Postgres RPC |
| S3 | Inconsistent error response format across API endpoints | `src/app/api/oauth/decision/route.ts:105-107` | Follow RFC 6749 `{ error, error_description }` |
| S4 | SCIM missing PATCH support (RFC 7644) | `src/app/api/scim/v2/ServiceProviderConfig/route.ts:6` | Implement PATCH handler |
| S5 | No data retention for unbounded-growth tables | `sso_audit_events`, `saml_assertions`, `webhook_deliveries`, `login_attempts` | Add pg_cron cleanup with retention policies |
| S6 | Missing composite index for webhook dispatch | `supabase/migrations/...:485` | Add composite index on `(active, product_id)` |
| S7 | SCIM bearer fallback compares against certificate column | `src/lib/scim-auth.ts:38-42` | Remove dead code path |
| S8 | SCIM Groups returns empty members array | `src/app/api/scim/v2/Groups/route.ts:30` | Join with `org_memberships` |
| S9 | SAML ACS uses `var` declarations (hoisting fragility) | `src/app/saml/acs/route.ts:113-115` | Use `let` before if block |
| S10 | Duplicate `toRow`/`roleName` helpers | `src/lib/rbac.ts:19-28`, `src/lib/organizations.ts:19-28` | Extract to shared utility |
| S11 | Google SDK loaded eagerly on every auth page load | `src/app/(auth)/login/login-form.tsx` | Lazy-load on user action |
| S12 | No ADRs for major architectural decisions | — | Document key decisions |
| S13 | No API documentation for SCIM/SAML/OAuth | — | Add OpenAPI spec |
| S14 | Form labels missing `htmlFor`/`id` association | Login, signup, change-password forms | Add proper `<label>` elements |
| S15 | `muted-foreground` contrast fails WCAG AA (~4.14:1) | `docs/DESIGN.md` | Increase to 4.5:1+ |


---

## 🗺️ Roadmap

| Priority | Feature | Status | Notes |
|---|---|---|---|
| P1 | Azure AD SAML SSO | Planned | Enterprise IdP integration for B2B customers |
| P2 | Azure AD SCIM provisioning | Planned | Auto-sync users from Azure AD |
| P3 | Okta SAML SSO | Planned | Alternative enterprise IdP |
| P4 | Custom SAML IdP support | Planned | Generic SAML 2.0 IdP integration |

### Azure AD SAML Integration Plan

**When to enable:** When first enterprise customer requests SAML SSO.

**Prerequisites:**
1. Enterprise customer with Azure AD tenant
2. Azure AD Premium license (for SAML SSO)

**Implementation steps:**
1. Enable SAML routes (uncomment `src/app/saml/`)
2. Add Azure AD IdP to `saml_idps` table
3. Configure Azure AD Enterprise Application:
   - ACS URL: `https://id.zuiio.com/saml/acs`
   - Entity ID: `https://id.zuiio.com/saml/metadata`
   - Attribute mapping: email, name, groups
4. Test SSO flow end-to-end
5. Add SCIM provisioning for user sync