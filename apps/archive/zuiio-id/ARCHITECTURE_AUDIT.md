# Architecture Review — Zuiio ID

**Date:** 2026-07-17
**Mode:** Standard
**Stack:** Next.js 16.3, React 19, Supabase Auth (GoTrue), Supabase SSR, Tailwind v4, jose, Zod, React Hook Form, @node-saml/node-saml, fast-xml-parser
**LOC:** ~9,000 (src/)
**DB:** 14 tables (Postgres via Supabase), 2 migrations
**Deployment:** Vercel (iad1), single region
**Agents:** 4 specialists (Structure/Security, Data/API, Quality/Perf, Ops/Types/Patterns)

---

## Executive Summary

Zuiio ID is the central SSO identity provider for the Zuiio ecosystem — a high-stakes, trust-boundary system. The codebase has solid structural foundations: clean module boundaries, well-normalized schema with RLS on all tables, excellent Next.js 16 App Router compliance, and strong TypeScript discipline. The SCIM v2 implementation is notably well-built with RFC-compliant error handling and discovery endpoints.

However, **4 Critical security findings** require immediate remediation before production use: SAML ACS accepts forged assertions (no signature verification), SCIM deactivation logic is inverted, webhook admin endpoints lack authorization, and HMAC continuation token comparison is timing-unsafe. Additionally, the system has zero error tracking, no health checks, zero tests for security-critical paths, and significant performance concerns from creating new admin Supabase clients on every call.

**Overall: 3.1 / 5**

---

## Mental Model

Zuiio ID serves as the OIDC provider for Zer, Tolom, and future Zuiio products. One account, one login, every product. The system handles:

1. **Authentication:** Email/password, Google OAuth, Apple Sign In, Passkeys/WebAuthn, MFA/TOTP
2. **SSO Federation:** OIDC consent flow with continuation tokens linking auth flows back to originating products
3. **SAML IdP:** Accepts SAML assertions from external identity providers
4. **SCIM v2:** User/group provisioning from external systems (Azure AD, Okta, etc.)
5. **RBAC + Organizations:** Multi-tenant role-based access with org membership management
6. **Webhooks:** Event dispatch to products on auth events (consent, MFA, session revocation)

The trust boundary is everything downstream of `proxy.ts` — any request passing through gets a refreshed JWT. The `createAdminClient()` bypasses RLS and is the primary attack surface if compromised.

---

## Scores

| Dimension | Score | Key Finding |
|---|---|---|
| D1 Structural Integrity | **4/5** | Clean module boundaries, proper dependency direction |
| D2 Scalability Readiness | **3/5** | New admin client per call, no RBAC caching |
| D3 Security Posture | **2/5** | SAML bypass, HMAC timing attack, missing authz |
| D4 Dependency Health | **3/5** | Unused @node-saml dep, no audit script |
| D5 Testing Architecture | **1/5** | Zero tests for security-critical auth paths |
| D6 Error Handling & Resilience | **3/5** | Centralized errors, but fire-and-forget everywhere |
| D7 Data Architecture | **4/5** | Well-normalized schema, RLS correct, cleanup gaps |
| D8 API Design | **4/5** | SCIM v2 strong, but missing PATCH, inconsistent errors |
| D9 Performance & Resource Hygiene | **2/5** | Dynamic imports per call, no connection reuse |
| D10 Observability & Operations | **1/5** | No error tracking, no health checks, no metrics |
| D11 Deployment & CI/CD | **3/5** | Solid Vercel setup, single region, no rollback docs |
| D12 Documentation & Knowledge | **2/5** | Good product docs, zero ADRs/API docs/runbooks |
| D13 Type Design & Contracts | **4/5** | Strong TS discipline, proper boundary types |
| D14 Accessibility & Internationalization | **3/5** | Good basics, missing form labels, no i18n framework |
| D15 Concurrency & Async | **4/5** | Clean async, but fire-and-forget failure risks |
| D16 Design Patterns & Framework Compliance | **4/5** | Excellent Next.js 16, Server Actions, RSC patterns |
| **Overall** | **3.1 / 5** | |

---

## Critical Findings

### C1. SAML ACS accepts forged assertions — complete auth bypass

**[CODE-VERIFIED]** `src/app/saml/acs/route.ts:18-20,29-38`

The SAML Assertion Consumer Service decodes `SAMLResponse` from base64, parses it with `fast-xml-parser`, but **never verifies the XML digital signature**. The code has a comment acknowledging this ("simplified — production would use @node-saml/node-saml"), yet `@node-saml/node-saml` is listed in `package.json` but never imported.

Additionally, the ACS **ignores `InResponseTo`** — never reads the `saml_request_id` cookie set during SSO initiation (`src/app/saml/sso/route.ts:63`), enabling unsolicited assertion injection.

**Impact:** Any attacker can craft a base64-encoded SAML Response XML with an arbitrary `NameID`/email and POST it to `/saml/acs` to authenticate as any user. This is a complete authentication bypass when SAML is enabled.

**Fix:** Replace manual XML parsing with `@node-saml/node-saml`'s `postValidateSamlResponse()` which handles signature verification, certificate validation, and InResponseTo checking. Remove `fast-xml-parser` from SAML paths.

**Effort:** 2-3 days. **Debt:** T8 Security Debt.

---

### C2. SCIM POST /Users deactivation logic is inverted

**[CODE-VERIFIED]** `src/app/api/scim/v2/Users/route.ts:147-149`

When SCIM creates a user with `active:false`, the code calls `updateUserById` with `ban_duration: 'none'` — which **removes** bans instead of banning. The `PUT` handler at `[id]/route.ts:163` correctly uses `ban_duration: '100y'`.

```typescript
// WRONG — line 147-149
ban_duration: "none", // removes ban!

// CORRECT (from PUT handler)
ban_duration: "100y", // 100-year ban = deactivation
```

**Impact:** Users provisioned as inactive through SCIM POST are actually active. External IdPs (Azure AD, Okta) deprovisioning users via SCIM will fail to deactivate them.

**Fix:** Change `ban_duration: "none"` to `ban_duration: "100y"` in the POST handler.

**Effort:** 5 minutes. **Debt:** T8 Security Debt.

---

### C3. Webhook admin endpoints lack authorization

**[CODE-VERIFIED]**
- `src/app/api/admin/webhooks/route.ts:33-68` (POST) — checks `getUser()` but no admin role
- `src/app/api/admin/webhooks/[id]/route.ts:8-19` (DELETE) — **no auth check at all**

The POST handler only verifies the user is authenticated. The DELETE handler never calls `getUser()` or checks any authorization. Any unauthenticated request can delete webhook subscriptions; any authenticated user (including non-admins) can create them.

**Impact:** Any user can create webhook subscriptions for any `product_id` (including other orgs' products) and delete any subscription by ID. This enables webhook hijacking and denial of service.

**Fix:** Add admin role check (via RBAC `userHasPermission` or direct `org_memberships` + `roles` query) to both handlers. The DELETE handler must verify authentication first.

**Effort:** 1 day. **Debt:** T8 Security Debt.

---

### C4. HMAC continuation token comparison is timing-unsafe

**[CODE-VERIFIED]** `src/lib/auth/continuation.ts:66`

```typescript
// CURRENT — short-circuits on first differing byte
if (signature !== expectedSignature) { return null; }
```

Uses `!==` which short-circuits on the first differing character. An attacker can measure response times to guess the HMAC signature byte-by-byte via timing side-channel.

**Impact:** Continuation tokens (which link auth flows back to products and carry `productId` + `returnTo`) can be forged through timing attacks. Combined with C1's SAML bypass, this compounds the attack surface.

**Fix:** Use `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))`.

**Effort:** 15 minutes. **Debt:** T8 Security Debt.

---

## Important Findings

### I1. Admin webhook POST lacks admin role check

**[CODE-VERIFIED]** `src/app/api/admin/webhooks/route.ts:33-68`

POST handler checks `getUser()` but performs no RBAC/admin check. Any authenticated user can create webhook subscriptions for any `product_id`.

**Fix:** Verify the user has admin role in the target product's org before creating the subscription.

---

### I2. OAuth decision endpoint uses getSession() instead of getUser()

**[CODE-VERIFIED]** `src/app/api/oauth/decision/route.ts:50-51`

Uses `supabase.auth.getSession()` which reads from cookies without server-side JWT validation. For a consent decision endpoint, `getUser()` is required to verify the session hasn't been revoked.

**Fix:** Replace `getSession()` with `getUser()` for server-side verification.

---

### I3. No cleanup mechanism for expired auth_continuations

**[CODE-VERIFIED]** `supabase/migrations/20260716090000_zuiio_id_schema.sql:170-179`

`auth_continuations` accumulates rows indefinitely. No `pg_cron`, no Edge Function, no app-level cleanup. `login_attempts` has `cleanupOldAttempts()` but `auth_continuations` has nothing.

**Fix:** Add a pg_cron job or Edge Function to delete rows where `expires_at < now() - interval '1 day'`.

---

### I4. Webhook retry delivery recorded but never processed

**[CODE-VERIFIED]** `src/lib/webhooks.ts:115-148`

`handleFailedDelivery` stores `next_retry_at` timestamps and creates an index on `(status, next_retry_at)`, but no background worker reads this index. Failed webhooks remain in `pending` status forever.

**Fix:** Implement a pg_cron job or Supabase Edge Function to process pending retries.

---

### I5. createAdminClient creates new client on every call with dynamic imports

**[CODE-VERIFIED]** `src/lib/supabase/server.ts:39-51`

Every call performs two dynamic imports (`@supabase/supabase-js`, `./env`) and creates a new client instance. Called 5-7 times per request (rate limiting, RBAC, audit, webhooks). Under load, generates thousands of client instances per minute.

**Fix:** Use a module-level singleton (safe in Node.js) or a request-scoped cache. Dynamic imports are unnecessary — these modules are already in the server bundle.

---

### I6. No error tracking — all auth errors go to console.error

**[CODE-VERIFIED]** `src/app/(auth)/login/actions.ts:150-153`, `src/lib/supabase/audit.ts:40-52`

No Sentry, Datadog, or any structured error tracking. `console.error` is ephemeral in Vercel serverless. Critical auth failures (failed SSO, webhook delivery errors, audit insert failures) are silently lost.

**Impact:** For an identity provider handling ecosystem SSO, inability to track auth failures means zero visibility into attacks, misconfigurations, and degraded service.

**Fix:** Add Sentry (already a `@zuiio/capture` workspace package exists). At minimum, capture auth failures as structured events.

---

### I7. No health check endpoints

**[CODE-VERIFIED]** No `/health`, `/healthz`, `/ready` endpoints exist.

No application-level health check for DB connectivity, Supabase auth availability, or dependency readiness. Vercel's infrastructure-level checks don't verify application health.

**Fix:** Add `/api/health` that verifies DB connectivity and Supabase auth endpoint reachability.

---

### I8. acceptInvite has TOCTOU race condition

**[CODE-VERIFIED]** `src/lib/organizations.ts:157-196`

Checks membership (select) then inserts (insert) in two separate queries with no transaction wrapper. Two concurrent requests with the same invite token could both pass the membership check. The `unique(org_id, user_id)` constraint catches it but produces a confusing generic error.

**Fix:** Use a Supabase RPC function with `BEGIN/COMMIT` or check-then-insert in a single SQL statement.

---

### I9. createOrganization lacks transaction — orphan risk

**[CODE-VERIFIED]** `src/lib/organizations.ts:51-79`

Inserts into `organizations` then `org_memberships` as separate queries. If the membership insert fails, an orphan organization is created with no owner.

**Fix:** Use a Supabase RPC function that wraps both inserts in a transaction.

---

### I10. SCIM GET /Users doesn't resolve email

**[CODE-VERIFIED]** `src/app/api/scim/v2/Users/route.ts:48-70`

Queries only `profiles` table which has no `email` column. Returns all users with empty email strings. The GET `/:id` handler correctly fetches email via `getUserById()`.

**Fix:** Join with `auth.users` (via admin client) or batch-fetch emails for the list endpoint.

---

### I11. SCIM token stored in plaintext

**[CODE-VERIFIED]** `src/lib/products/catalog.ts:76-88`, migration `scim_token text unique`

SCIM bearer tokens stored as plaintext in `product_catalog`. If the database is compromised, all tokens are immediately usable.

**Fix:** Hash tokens at rest (SHA-256). `verifyScimToken` should hash the incoming token before comparison.

---

### I12. No rate limiting on API endpoints

**[CODE-VERIFIED]** `src/app/api/oauth/decision/route.ts`, `src/app/saml/acs/route.ts`, `src/app/api/scim/v2/`

Rate limiting via `checkRateLimit` is applied only in login/forgot-password server actions. None of the API route handlers (OAuth decision, SCIM, SAML ACS, webhook admin) have rate limiting.

**Fix:** Apply rate limiting to OAuth consent endpoint and SCIM provisioning endpoints at minimum.

---

### I13. SAML ACS listUsers pagination truncates at 1000

**[CODE-VERIFIED]** `src/app/saml/acs/route.ts:103-105`

Fallback for existing users uses `listUsers({page:1, perPage:1000})`. Beyond 1000 users, SAML login fails with `saml_user_creation_failed`.

**Fix:** Implement paginated user lookup or use a direct DB query instead of the admin API.

---

### I14. SCIM POST /Users skips username/email validation

**[CODE-VERIFIED]** `src/app/api/scim/v2/Users/route.ts:130-135`

Accepts `userName`/`email` without validating against signup rules (format regex, reserved names, email format). SCIM clients can create users with invalid data that normal signup would reject.

**Fix:** Reuse the validation logic from signup actions or database triggers.

---

## Suggestions

### S1. SAML SLO picks first IdP rather than user's actual IdP
`src/app/saml/slo/route.ts:43-45` — Uses `Array.find()` for first active IdP with SLO URL. In multi-IdP deployments, sends logout to wrong IdP. Track IdP during ACS via session cookie.

### S2. userHasPermission makes 3 sequential DB round-trips
`src/lib/rbac.ts:116-149` — Three sequential queries (role_id → permission_id → check). Could be a single Postgres RPC function.

### S3. Inconsistent error response format
`src/app/api/oauth/decision/route.ts:105-107` returns `{ error_code }` while other routes return `{ error: string }`. Should follow RFC 6749 `{ error, error_description }`.

### S4. SCIM missing PATCH support
`src/app/api/scim/v2/ServiceProviderConfig/route.ts:6` declares `patch: { supported: false }`. RFC 7644 Section 3.5.2 requires PATCH. Major IdPs use PATCH as primary operation.

### S5. No data retention strategy
`sso_audit_events`, `saml_assertions`, `webhook_deliveries`, `login_attempts` grow without bound. No cleanup mechanism. GDPR data minimization requires retention policies.

### S6. Missing composite index for webhook dispatch
Migration only indexes `product_id` for webhook subscriptions. Query filters on `active=true` + array containment on `events`. Composite index would improve performance.

### S7. SCIM bearer token fallback compares against certificate column
`src/lib/scim-auth.ts:38-42` — Fallback queries `saml_idps.certificate` with the bearer token. Certificate stores X.509 PEM data, not tokens. Dead code path.

### S8. SCIM Groups returns empty members
`src/app/api/scim/v2/Groups/route.ts:30` — Hardcodes `members: []`. SCIM clients get organizations with no members.

### S9. SAML ACS uses var declarations
`src/app/saml/acs/route.ts:113-115` — `var userId` inside both if/else branches. Hoisting creates same function-scoped variable. Use `let` before the if block.

### S10. Duplicate toRow/roleName helpers
`src/lib/rbac.ts:19-28` and `src/lib/organizations.ts:19-28` — Identical implementations. Extract to shared utility.

### S11. Google SDK loaded eagerly
`src/app/(auth)/login/login-form.tsx` — GSI SDK loads with `afterInteractive` on every page load. Add latency for users who don't use Google sign-in.

### S12. No ADRs for major architectural decisions
Supabase Auth over custom, SAML approach, continuation token design, webhook retry strategy — none documented.

### S13. No API documentation
SCIM, SAML, OAuth endpoints undocumented. No OpenAPI spec.

### S14. Form labels missing htmlFor/id
Login, signup, change-password forms use `<span>`/`<div>` labels without proper `<label htmlFor>` association. Breaks screen reader navigation.

### S15. muted-foreground contrast fails WCAG AA
`docs/DESIGN.md` acknowledges ~4.14:1 contrast ratio for secondary text (needs 4.5:1).

---

## Strengths

### Structural Integrity (D1)
- Clean module boundaries with proper dependency direction: `lib/` → `app/`, workspace packages → app
- Centralized `AuthErrorCode` type with 25 error codes and Mongolian messages
- `AuthActionState` interface as shared contract for all Server Actions
- Product catalog is properly DB-driven with React `cache()` deduplication

### Data Architecture (D7)
- Well-normalized schema with `citext` for case-insensitive usernames
- RLS enabled on all 14 tables with correct scoping
- `revoke all on anon/authenticated` for sensitive tables
- Partial indexes for efficient queries (e.g., unconsumed continuations)
- Idempotent migrations with `IF NOT EXISTS` for safe re-runs
- Database triggers for `updated_at` and profile auto-creation

### API Design (D8)
- SCIM v2 compliance is strong: correct `Content-Type`, URN schemas, RFC-compliant errors with `scimType`, pagination, full discovery endpoints
- OAuth revoke follows RFC 7009 (always returns 200)
- Continuation tokens use HMAC signing with TTL and path validation

### Type Design (D13)
- `strict: true` with `noUncheckedIndexedAccess`
- Proper string union for `AuthErrorCode` (not enum)
- All domain interfaces explicit with proper naming
- `Record<string, unknown>` used defensively for Supabase row narrowing
- OAuth globals well-declared in `src/types/`

### Concurrency (D15)
- Clean async/await patterns throughout
- `AbortSignal.timeout(10s)` on webhook delivery
- Exponential backoff for webhook retries (5s/30s/5min)
- `autoRefreshToken: false` on admin client
- React `cache()` deduplication in product catalog queries

### Framework Compliance (D16)
- Excellent Next.js 16 App Router patterns
- Server Components for pages, Server Actions for mutations
- `useActionState` for form state management
- PPR with static shell + Suspense boundaries
- `cookies()` / `headers()` used correctly
- `server-only` package imported to prevent client leakage

---

## Tech Debt Summary

| Category | Findings | Est. Effort |
|---|---|---|
| T1 Architectural Decay | 2 (auth_continuations cleanup, webhook retry) | 3 days |
| T3 Type/Contract Debt | 2 (inconsistent error format, SCIM PATCH) | 2 days |
| T4 Test Debt | 1 (zero tests for security-critical paths) | 5 days |
| T6 Performance Debt | 2 (admin client per call, RBAC round-trips) | 2 days |
| T7 Error Handling/Observability Debt | 2 (no error tracking, no health checks) | 3 days |
| T8 Security Debt | 4 (SAML, HMAC, SCIM deactivation, authz) | 4 days |
| T9 Documentation Drift | 2 (no ADRs, no API docs) | 2 days |
| **Total** | **15** | **~21 days** |

---

## Risk Matrix

| Risk | Likelihood | Impact | Effort to Fix | Priority |
|---|---|---|---|---|
| SAML assertion forgery (C1) | High (if SAML enabled) | Critical | 2-3 days | **P0** |
| SCIM deactivation bypass (C2) | High (if SCIM used) | Critical | 5 min | **P0** |
| Webhook admin hijack (C3) | Medium | Critical | 1 day | **P0** |
| HMAC timing attack (C4) | Low | High | 15 min | **P0** |
| No error tracking (I6) | Certain | High | 3 days | **P1** |
| Admin client overhead (I5) | High under load | Medium | 1 day | **P1** |
| Zero security tests (I-Quality) | Certain | High | 5 days | **P1** |
| No health checks (I7) | Certain | Medium | 1 day | **P1** |
| Plaintext SCIM tokens (I11) | Low | High | 1 day | **P2** |
| No API rate limiting (I12) | Medium | Medium | 1 day | **P2** |

---

## Action Plan

### Immediate (P0 — this week)
1. **C2:** Fix SCIM deactivation `ban_duration: "none"` → `"100y"` (5 min)
2. **C4:** Replace HMAC `!==` with `crypto.timingSafeEqual()` (15 min)
3. **C1:** Integrate `@node-saml/node-saml` for SAML signature verification (2-3 days)
4. **C3:** Add auth + admin role check to webhook admin endpoints (1 day)

### Short-term (P1 — this sprint)
5. **I6:** Add Sentry via `@zuiio/capture` workspace package (3 days)
6. **I5:** Singleton admin client, remove dynamic imports (1 day)
7. **I7:** Add `/api/health` endpoint (1 day)
8. **I2:** Replace `getSession()` with `getUser()` in OAuth decision (15 min)
9. **Tests:** Add tests for HMAC, rate limiting, RBAC, OAuth decision, SAML, SCIM (5 days)

### Medium-term (P2 — this quarter)
10. **I3:** Add pg_cron for auth_continuations cleanup (1 day)
11. **I4:** Add pg_cron or Edge Function for webhook retry processing (1 day)
12. **I11:** Hash SCIM tokens at rest (1 day)
13. **I12:** Apply rate limiting to API endpoints (1 day)
14. **I8/I9:** Wrap org operations in transactions via RPC functions (1-2 days)
15. **S4:** Implement SCIM PATCH support (2 days)

### Long-term (P3 — roadmap)
16. **S5:** Data retention policies for audit/event tables
17. **S2:** Consolidate RBAC into single RPC function
18. **S13:** OpenAPI documentation for all endpoints
19. **S14:** Fix form labels for WCAG compliance
20. **S15:** Adjust muted-foreground contrast to meet WCAG AA

---

## Looks Bad But Is Actually Fine

- **`proxy.ts` instead of `middleware.ts`**: Next.js 16 renamed `middleware.ts` → `proxy.ts`. This file IS the middleware — it runs on every navigation. Not dead code.
- **`createAdminClient` dynamic imports**: Intentionally avoids bundling `@supabase/supabase-js` in edge/client contexts. Server-side dynamic import is a common Next.js pattern for code-splitting server deps.
- **`catch {}` blocks in `server.ts`**: `getAll()` returns empty array on error (Server Component context can't write cookies). `setAll()` silently ignores errors from Server Components — correct behavior per Supabase SSR docs.
- **Fire-and-forget audit logging**: Audit failures must never block OAuth decisions. `console.error` + continue is intentional fail-open design.
- **Rate limiting fails open**: If the DB is unreachable during rate limit check, allowing the attempt is correct — availability over strictness for an identity system.

---

## What Was Not Reviewed

- **Mobile OAuth flows** (deep link callbacks for Zer/Tolom mobile apps)
- **Passkey/WebAuthn implementation** (relies on Supabase built-in, not custom code)
- **MFA/TOTP implementation** (relies on Supabase built-in)
- **Client-side form components** in detail (login-form, signup-form, consent-form — covered for a11y/patterns but not exhaustive)
- **Tailwind v4 token system** (covered in docs/DESIGN.md review, not re-audited)
- **Vercel deployment logs** (would require production access)

---

## Methodology

- **Mode:** Standard (4 specialist slices)
- **Dimensions:** 16/16
- **Agents:** 4 specialists (Structure/Security, Data/API, Quality/Perf, Ops/Types/Patterns) + 1 synthesizer
- **Files examined:** 42 source files, 2 migrations, config files
- **LOC scanned:** ~9,000
- **Prior audit:** None (first run)
