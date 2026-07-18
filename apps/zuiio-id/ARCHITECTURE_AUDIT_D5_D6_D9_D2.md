# Architecture Audit — Zuiio ID
## Slice 3: Quality, Performance & Resilience

**Auditor:** QualityPerfAudit  
**Date:** 2026-07-17  
**Codebase:** ~9K LOC in src/, Next.js 16.3 on Vercel (iad1)

---

## D5 — Testing Architecture: **1/5**

**Justification:** The codebase has ZERO tests for security-critical authentication flows. Only 2 utility tests exist (passkey error handling, Google nonce generation). The entire SSO identity provider — rate limiting, HMAC tokens, RBAC, webhook verification, SAML processing, OAuth flows — runs untested in production.

### Findings

**[Critical] [D5-1] No tests for HMAC continuation token verification**  
`src/lib/auth/continuation.ts:48-87`  
The `verifyContinuation()` function handles tamper detection for auth flow tokens. It performs HMAC signature verification, expiry checks, returnTo validation, and product catalog lookups. Zero test coverage means:
- Signature bypass could go undetected
- Expiry logic bugs could allow expired tokens
- returnTo validation gaps could enable open redirects

**Impact:** If `verifyContinuation` has a logic bug, attackers could forge continuation tokens to redirect users to malicious sites after authentication.

**Fix:** Add unit tests for: valid token verification, expired token rejection, tampered signature rejection, invalid returnTo rejection, missing product rejection.

---

**[Critical] [D5-2] No tests for rate limiting logic**  
`src/lib/rate-limit.ts:18-72`  
Rate limiting is the primary defense against brute-force attacks. The implementation has complex logic:
- Window-based counting (15-minute sliding window)
- Failed attempt filtering (`.eq("success", false)`)
- Retry-after calculation
- Fail-open behavior

Zero tests means:
- Window boundary conditions untested
- Fail-open behavior unverified
- Interaction with `recordLoginAttempt` untested

**Impact:** Brute-force protection could silently fail or block legitimate users.

**Fix:** Add tests for: rate limit enforcement, window expiry, fail-open on DB errors, retry-after calculation accuracy.

---

**[Critical] [D5-3] No tests for RBAC permission checks**  
`src/lib/rbac.ts:116-161`  
`userHasPermission()` makes 3 sequential DB queries to verify access. Zero tests means:
- Permission inheritance untested
- Role-permission mapping bugs undetected
- Edge cases (missing role, missing permission) unhandled

**Impact:** Authorization bypass could allow unauthorized access to protected resources.

**Fix:** Add integration tests with seeded roles/permissions covering: owner permissions, member permissions, viewer permissions, non-member access denial.

---

**[Critical] [D5-4] No tests for webhook signature verification**  
`src/lib/webhooks.ts:168-181`  
`verifyWebhookSignature()` uses constant-time comparison (good), but zero tests means:
- Comparison logic unverified
- Edge cases (empty payload, wrong length signature) untested

**Impact:** Webhook receivers could accept forged payloads if verification is broken.

**Fix:** Add tests for: valid signature verification, invalid signature rejection, timing-safe comparison verification.

---

**[Critical] [D5-5] No tests for OAuth consent decision flow**  
`src/app/api/oauth/decision/route.ts:25-103`  
The consent endpoint handles approve/deny decisions with session validation, SDK method calls, and audit logging. Zero tests means:
- Session validation bypass untested
- SDK error handling unverified
- Audit logging gaps undetected

**Impact:** OAuth consent flow could be exploited to bypass authorization or skip audit trails.

**Fix:** Add integration tests for: authenticated approve, authenticated deny, unauthenticated rejection, SDK error handling.

---

**[Critical] [D5-6] No tests for SAML assertion processing**  
`src/app/saml/acs/route.ts:15-161`  
The SAML ACS endpoint parses XML, extracts user attributes, and performs JIT provisioning. Zero tests means:
- XML parsing vulnerabilities undetected
- Attribute extraction bugs uncaught
- User provisioning logic unverified

**Impact:** SAML authentication could fail silently or create invalid user accounts.

**Fix:** Add tests with sample SAML responses covering: valid assertion parsing, missing email handling, JIT user creation, existing user handling.

---

**[Important] [D5-7] No end-to-end tests despite Playwright in dependencies**  
`package.json:46`  
`@playwright/test` is in devDependencies but zero E2E tests exist. Critical user flows untested:
- Login → session creation → redirect
- Signup → email verification → profile setup
- OAuth consent → token issuance → redirect
- SAML SSO → JIT provisioning → session

**Impact:** Integration bugs between components go undetected until production.

**Fix:** Add E2E tests for at least: login flow, signup flow, OAuth consent flow.

---

**[Important] [D5-8] No contract tests for error codes**  
`src/lib/errors.ts:1-93`  
25 error codes defined but zero tests verify:
- Error codes match API response format
- Error messages are user-safe (no internal details)
- Error codes are consistent across endpoints

**Impact:** API contract violations could leak internal errors to users.

**Fix:** Add snapshot tests for error code format and message safety.

---

### Strengths
- Vitest configured with proper test utilities (@testing-library/react, @testing-library/jest-dom)
- 2 existing tests are well-written and test real behavior
- Test infrastructure ready for expansion

---

## D6 — Error Handling & Resilience: **3/5**

**Justification:** Good centralized error codes and fail-open design for rate limiting. However, multiple silent error swallowing patterns and a critical SAML security gap reduce the score.

### Findings

**[Critical] [D6-1] SAML ACS has no signature verification**  
`src/app/saml/acs/route.ts:29-38`  
The code parses raw SAML XML without verifying the response signature:
```typescript
const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
const parser = new XMLParser({...});
const parsed = parser.parse(decoded);
```
The comment says "production would use @node-saml/node-saml" but it's not implemented. `@node-saml/node-saml` IS in dependencies (package.json:27).

**Impact:** Attackers can forge SAML responses to authenticate as any user. Critical security vulnerability.

**Fix:** Use `@node-saml/node-saml` for proper signature verification before processing assertions.

---

**[Critical] [D6-2] SAML ACS fallback fetches ALL users**  
`src/app/saml/acs/route.ts:103-106`  
When `inviteUserByEmail` fails, the code fetches up to 1000 users to find the email:
```typescript
const { data: users } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
const existingUser = users?.users?.find((u) => u.email === email);
```

**Impact:** 
- Only checks first 1000 users — fails silently for users beyond that
- Expensive query that could timeout under load
- Linear search through results

**Fix:** Use `admin.auth.admin.getUserByEmail(email)` instead of listing all users.

---

**[Important] [D6-3] `recordLoginAttempt` silently swallows ALL errors**  
`src/lib/rate-limit.ts:146-148`  
```typescript
} catch {
  // Never block auth flow on audit failure
}
```
No logging, no metrics. If the database insert fails repeatedly, audit records are lost silently.

**Impact:** Security audit trail gaps go undetected. Could mask database issues.

**Fix:** Add `console.error` logging in the catch block for observability.

---

**[Important] [D6-4] `dispatchWebhook` silently swallows ALL errors**  
`src/lib/webhooks.ts:71-73`  
```typescript
} catch {
  // Webhook dispatch failures must never block auth flows
}
```
If the subscription query fails or delivery record creation fails, no logging occurs.

**Impact:** Webhook delivery failures go undetected. Could mask integration issues.

**Fix:** Add `console.error` logging in the catch block.

---

**[Important] [D6-5] Webhook retry mechanism is dead code**  
`src/lib/webhooks.ts:148-159`  
The code sets `next_retry_at` in the database for failed deliveries:
```typescript
await admin
  .from("webhook_deliveries")
  .update({
    attempts: newAttempts,
    next_retry_at: new Date(Date.now() + delay).toISOString(),
    ...
  })
```
But there is NO cron job, background worker, or scheduled task that processes `next_retry_at`. Grep for `cron`, `schedule`, `interval` returns zero results.

**Impact:** Failed webhooks are never retried. The retry logic is non-functional.

**Fix:** Either implement a Vercel Cron Job or Supabase pg_cron to process pending deliveries, or remove the retry logic to avoid confusion.

---

**[Important] [D6-6] `checkPasswordResetRateLimit` counts ALL attempts, not just failures**  
`src/lib/rate-limit.ts:88-92`  
Unlike `checkRateLimit` (line 31) which filters `.eq("success", false)`, the password reset rate limit counts ALL login_attempts:
```typescript
const { count } = await admin
  .from("login_attempts")
  .select("*", { count: "exact", head: true })
  .eq("identifier", email.toLowerCase())
  .gte("attempted_at", windowStart);
```
Combined with `recordLoginAttempt(email, true)` in forgot-password/actions.ts:41, this means successful logins count toward the password reset limit.

**Impact:** A user who logs in 3 times in 15 minutes cannot request a password reset.

**Fix:** Either use a separate identifier (e.g., `reset:${email}`) or add a type column to distinguish password reset attempts from login attempts.

---

**[Important] [D6-7] `recordSamlAssertion` has no error handling**  
`src/lib/saml-config.ts:96-107`  
```typescript
export async function recordSamlAssertion(params: {...}): Promise<void> {
  const admin = await createAdminClient();
  await admin.from("saml_assertions").insert({...});
}
```
No try/catch. If the insert fails, the error propagates to the caller and could break the SAML flow.

**Impact:** SAML authentication could fail due to audit logging failures.

**Fix:** Wrap in try/catch with console.error logging, similar to `auditEvent` pattern.

---

**[Important] [D6-8] HMAC signature comparison is not constant-time**  
`src/lib/auth/continuation.ts:66`  
```typescript
if (signature !== expectedSignature) return null;
```
JavaScript's `!==` operator short-circuits on first differing character, enabling timing attacks.

**Impact:** Attackers could measure response times to guess the HMAC signature byte-by-byte.

**Fix:** Use `crypto.timingSafeEqual()` for constant-time comparison.

---

**[Important] [D6-9] Floating promise in login action**  
`src/app/(auth)/login/actions.ts:89`  
```typescript
recordLoginAttempt(identifier, false, ip);
```
Not awaited, no `void` prefix. If the promise rejects, it creates an unhandled rejection. Inconsistent with line 111 which uses `void`.

**Impact:** Unhandled promise rejections could crash the process or pollute logs.

**Fix:** Add `void` prefix: `void recordLoginAttempt(identifier, false, ip);`

---

**[Suggestion] [D6-10] `createClient` `setAll` silently swallows cookie errors**  
`src/lib/supabase/server.ts:26-28`  
```typescript
} catch {
  // Called from Server Component — ignore
}
```
If cookies can't be set, the session won't persist but no error is logged.

**Impact:** Silent session failures in Server Components. Difficult to debug.

**Fix:** Add conditional logging: `if (process.env.NODE_ENV === 'development') console.warn(...)`.

---

### Strengths
- Centralized error codes (25 codes in errors.ts) with user-safe messages
- Fail-open design for rate limiting is documented and appropriate
- Webhook signature verification uses constant-time comparison (webhooks.ts:174-180)
- OAuth decision endpoint returns proper HTTP status codes
- User-facing errors don't leak internal details
- Audit events logged for critical operations

---

## D9 — Performance & Resource Hygiene: **2/5**

**Justification:** Significant performance issues in the critical path. `createAdminClient()` creates a new Supabase client on every call with dynamic imports, rate limiting makes multiple DB queries per check, and RBAC checks require 3 sequential queries. The proxy runs on every navigation adding latency.

### Findings

**[Critical] [D9-1] `createAdminClient` creates new client on EVERY call**  
`src/lib/supabase/server.ts:39-51`  
```typescript
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  const { url } = getSupabaseEnv();
  const { getServiceRoleKey } = await import("./env");
  return createSupabaseClient(url, getServiceRoleKey(), {...});
}
```
Dynamic imports are evaluated at runtime on every call. This function is called:
- 2x per rate limit check (checkRateLimit + recordLoginAttempt)
- 3x per RBAC check (userHasPermission)
- 1x per audit event
- 1x per webhook dispatch
- Multiple times per page load

**Impact:** 
- Dynamic import overhead on every call (module resolution, parsing)
- New Supabase client instance created each time (no connection reuse)
- Under load, creates thousands of client instances per minute

**Fix:** Cache the admin client instance at module level:
```typescript
let adminClient: ReturnType<typeof createSupabaseClient> | null = null;

export async function createAdminClient() {
  if (adminClient) return adminClient;
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const { url } = getSupabaseEnv();
  const { getServiceRoleKey } = await import("./env");
  adminClient = createSupabaseClient(url, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
```

---

**[Critical] [D9-2] Rate limiting makes 2 DB queries per check**  
`src/lib/rate-limit.ts:27-61`  
```typescript
// Query 1: Count failed attempts
const { count } = await admin
  .from("login_attempts")
  .select("*", { count: "exact", head: true })
  .eq("identifier", identifier.toLowerCase())
  .eq("success", false)
  .gte("attempted_at", windowStart);

// Query 2: Get oldest attempt (only if rate limited)
if (failedCount >= MAX_ATTEMPTS) {
  const { data: oldest } = await admin
    .from("login_attempts")
    .select("attempted_at")
    ...
}
```
Rate limiting runs on every login attempt. Two queries doubles the latency.

**Impact:** Adds ~10-20ms to every login attempt for database round-trips.

**Fix:** Combine into a single query that returns count and oldest attempt in one result.

---

**[Critical] [D9-3] `userHasPermission` makes 3 sequential DB queries**  
`src/lib/rbac.ts:122-161`  
```typescript
// Query 1: Get user's role
const { data: membership } = await admin
  .from("org_memberships").select("role_id")...

// Query 2: Get permission ID
const { data: perm } = await admin
  .from("permissions").select("id")...

// Query 3: Check role-permission mapping
const { data: rolePerm } = await admin
  .from("role_permissions").select("role_id")...
```
Three sequential round-trips for a single permission check.

**Impact:** 
- ~30-60ms latency per permission check
- If called multiple times per request, compounds quickly

**Fix:** Use a single query with joins:
```typescript
const { data } = await admin
  .from("org_memberships")
  .select("role_id, roles!inner(role_permissions!inner(permissions!inner(id)))")
  .eq("user_id", userId)
  .eq("org_id", orgId)
  .single();
```

---

**[Important] [D9-4] Proxy runs `getClaims()` on EVERY navigation**  
`src/proxy.ts:69`  
```typescript
await supabase.auth.getClaims();
```
This triggers JWT validation against the project's published public keys on every request matched by the proxy (everything except static assets). While it uses local WebCrypto for asymmetric keys, it still adds latency.

**Impact:** ~5-10ms added to every page load for JWT validation, even for unauthenticated pages.

**Fix:** 
- Consider skipping validation for public pages (login, signup, forgot-password)
- Or cache validated claims for the duration of the request

---

**[Important] [D9-5] No connection pooling strategy**  
`src/lib/supabase/server.ts:39-51`  
Each `createAdminClient()` call creates a fresh Supabase client with its own connection pool. Under horizontal scaling with multiple Vercel functions:
- Each function creates multiple client instances
- Each client maintains its own connection pool
- Could exhaust Supabase's connection limit

**Impact:** Under load, database connection exhaustion could cause failures.

**Fix:** 
- Cache client instances (see D9-1)
- Use Supabase's connection pooler (pgBouncer) for serverless environments
- Monitor connection count via Supabase dashboard

---

**[Important] [D9-6] `catalog.ts` caches function calls but not client creation**  
`src/lib/products/catalog.ts:67-84`  
```typescript
export const getEnabledProductById = cache(
  async (id: string): Promise<ProductCatalogRecord | null> => {
    const admin = await createAdminClient(); // Creates new client each time
    ...
  },
);
```
React's `cache()` deduplicates within a single request, but still creates a new admin client on each invocation.

**Impact:** Multiple product lookups in one request still create multiple clients.

**Fix:** Cache the admin client at module level (see D9-1).

---

**[Important] [D9-7] SAML ACS fallback fetches 1000 users**  
`src/app/saml/acs/route.ts:103-106`  
```typescript
const { data: users } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
const existingUser = users?.users?.find((u) => u.email === email);
```
Expensive query that fetches and deserializes 1000 user objects, then does linear search.

**Impact:** 
- High latency (~100-500ms)
- Only finds users in first 1000
- Memory allocation for 1000 user objects

**Fix:** Use `admin.auth.admin.getUserByEmail(email)` — O(1) lookup.

---

**[Important] [D9-8] `login_attempts` table grows unbounded**  
`src/lib/rate-limit.ts:155-162`  
`cleanupOldAttempts()` is called fire-and-forget after successful logins (login/actions.ts:112), but:
- No guaranteed execution (fire-and-forget)
- No coordination across concurrent requests
- If no one logs in, old records accumulate

**Impact:** Table grows indefinitely, slowing queries over time.

**Fix:** 
- Use Supabase pg_cron to run cleanup every hour
- Or add TTL index on `attempted_at` column

---

**[Suggestion] [D9-9] `checkPasswordResetRateLimit` creates new admin client**  
`src/lib/rate-limit.ts:85`  
```typescript
const admin = await createAdminClient();
```
Rate limit checks happen on every password reset request, creating a new Supabase client each time.

**Impact:** Unnecessary client creation overhead.

**Fix:** Reuse client from caller or cache at module level (see D9-1).

---

### Strengths
- Database indexes well-designed for query patterns (login_attempts, sso_audit_events, webhook_deliveries)
- Admin pages have reasonable limits (50 users, 100 audit events)
- Login history API limits to 20 records
- `cache()` in catalog.ts prevents duplicate queries within a request
- Proxy matcher excludes static assets (proxy.ts:78-84)

---

## D2 — Scalability Readiness: **2/5**

**Justification:** Stateless design is good, but rate limiting uses DB-backed storage (bottleneck under load), no caching layer for RBAC or SAML configs, and webhook delivery is synchronous. Single-region deployment limits global scalability.

### Findings

**[Critical] [D2-1] Rate limiting uses DB-backed storage**  
`src/lib/rate-limit.ts:22-71`  
Every rate limit check requires a database query:
```typescript
const admin = await createAdminClient();
const { count } = await admin
  .from("login_attempts")
  .select("*", { count: "exact", head: true })
  ...
```
Under high traffic, this becomes a bottleneck:
- Database connection pool exhaustion
- Query latency increases with table size
- No horizontal scaling for rate limiting

**Impact:** Rate limiting could fail or become prohibitively slow under load.

**Fix:** Use Redis or Vercel Edge Config for rate limiting:
- Atomic increment operations
- Built-in TTL support
- Horizontal scaling
- Sub-millisecond latency

---

**[Critical] [D2-2] No caching layer for RBAC**  
`src/lib/rbac.ts:116-161`  
Permission checks require 3 DB queries every time. No caching at any level:
- Role-permission mappings change rarely (admin action)
- Could be cached for hours/days
- Currently fetched fresh on every request

**Impact:** 
- Unnecessary database load
- High latency for permission checks
- Could become bottleneck under concurrent users

**Fix:** Cache role-permission mappings with React `cache()` or Redis:
```typescript
const getRolePermissions = cache(async (roleId: string) => {
  // Query and cache for request lifetime
});
```

---

**[Important] [D2-3] No caching for SAML IdP configurations**  
`src/lib/saml-config.ts:34-54`  
`getActiveIdps()` and `getIdpByEntityId()` query the database every time:
```typescript
export async function getActiveIdps(): Promise<SamlIdp[]> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("saml_idps")
    .select("*")
    .eq("active", true)
    .order("name");
  ...
}
```
SAML configurations change rarely (admin action) but are queried on every SAML authentication.

**Impact:** Unnecessary database load for rarely-changing data.

**Fix:** Cache with React `cache()` for request-level deduplication, or Redis for cross-request caching.

---

**[Important] [D2-4] Webhook delivery is synchronous**  
`src/lib/webhooks.ts:24-74`  
`dispatchWebhook()` is called synchronously after audit events:
```typescript
export async function auditEvent(event: AuditEvent): Promise<void> {
  ...
  // Dispatch webhook (fire-and-forget)
  void dispatchWebhook(event.eventType, {...});
}
```
While marked `void`, the function still executes synchronously until the first `await`. It queries subscriptions, creates delivery records, and initiates HTTP requests before returning.

**Impact:** Adds latency to audit event recording. Could slow down auth flows.

**Fix:** Use a queue (Supabase Queues, Vercel KV, or external queue) to fully decouple webhook delivery.

---

**[Important] [D2-5] Single-region deployment (iad1)**  
No multi-region strategy. All users hit US-East:
- Higher latency for users in other regions
- No failover if iad1 has issues
- No data residency compliance for other regions

**Impact:** 
- Users outside US-East experience 50-200ms additional latency
- No disaster recovery across regions

**Fix:** 
- Deploy to multiple Vercel regions
- Use Supabase read replicas for non-write queries
- Implement region-aware routing

---

**[Important] [D2-6] `login_attempts` table has no partitioning**  
`supabase/migrations/20260716090000_zuiio_id_schema.sql:240-256`  
```sql
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  ip_address inet,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);
```
No partitioning, no TTL. Table grows indefinitely.

**Impact:** 
- Query performance degrades as table grows
- No automatic cleanup of old records
- `cleanupOldAttempts()` is fire-and-forget, not guaranteed

**Fix:** 
- Partition by month on `attempted_at`
- Use Supabase pg_cron for guaranteed cleanup
- Or migrate to Redis with TTL

---

**[Important] [D2-7] Webhook delivery accumulates failed records**  
`src/lib/webhooks.ts:138-159`  
Failed deliveries are marked as "failed" but never cleaned up:
```typescript
if (newAttempts >= MAX_RETRIES) {
  await admin
    .from("webhook_deliveries")
    .update({ status: "failed", ... })
    .eq("id", deliveryId);
}
```
No cleanup job removes old failed deliveries.

**Impact:** Table grows indefinitely with failed records.

**Fix:** Add cleanup job to delete failed deliveries older than 30 days.

---

**[Suggestion] [D2-8] No rate limiting on signup action**  
`src/app/(auth)/signup/actions.ts:20-111`  
The signup action has no rate limiting. Attackers could create accounts rapidly.

**Impact:** Potential for account creation spam.

**Fix:** Add rate limiting similar to login/forgot-password actions.

---

### Strengths
- Stateless design (JWT-based, no server-side sessions)
- Supabase handles connection pooling at database level
- Vercel's edge network provides global CDN
- Database indexes well-designed for query patterns
- Fail-open design for rate limiting prevents cascading failures
- React `cache()` provides request-level deduplication

---

## Summary Scores

| Dimension | Score | Key Risk |
|-----------|-------|----------|
| **D5 Testing Architecture** | **1/5** | Zero tests for security-critical auth flows |
| **D6 Error Handling & Resilience** | **3/5** | SAML signature verification missing, silent error swallowing |
| **D9 Performance & Resource Hygiene** | **2/5** | Client creation on every call, multiple DB queries per check |
| **D2 Scalability Readiness** | **2/5** | DB-backed rate limiting, no caching layer, single-region |

## Top 5 Priority Fixes

1. **[D6-1] Implement SAML signature verification** — Critical security vulnerability
2. **[D9-1] Cache `createAdminClient` instance** — Highest performance impact
3. **[D2-1] Migrate rate limiting to Redis/Edge Config** — Scalability bottleneck
4. **[D5-1] Add tests for HMAC continuation tokens** — Security-critical untested code
5. **[D6-5] Implement webhook retry processing** — Dead code that should work or be removed

---

## Not Reviewed

- Client-side component rendering performance
- Bundle size analysis
- Image/font optimization
- Database query execution plans
- Supabase RLS policy correctness (requires database access)
- Vercel function cold start times
- Memory leak detection
- Accessibility (out of scope for this slice)
