---
date: 2026-05-30T12:51:32+0800
author: Temuulen Undrakhbayar
commit: 4884c8f
branch: main
repository: tolom
topic: "Centralized Authentication System"
tags: [research, codebase, auth, supabase, middleware, signup, rls]
status: complete
last_updated: 2026-05-30T12:51:32+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Centralized Authentication System

## Research Question
How does Tolom's auth currently work, what are the integration points for a centralized auth system, and what must change to support multiple projects sharing one Supabase identity store?

## Summary
Tolom's auth is tightly coupled to a single Supabase project via 4 client constructors and 3 environment variables. The architecture decision is to make **Tolom's existing Supabase project the central identity store** — all projects (login app, Tolom, future apps) point to the same Supabase URL + anon key. This eliminates cross-project JWT issues entirely. The login app is a standalone Next.js app connecting to Tolom's Supabase. The main work is: (1) build the login app, (2) add Google OAuth to Tolom's Supabase, (3) configure Resend SMTP, (4) ensure Tolom's existing auth pages coexist with the login app's redirect flow.

## Detailed Findings

### Supabase Client Architecture

Tolom has 4 Supabase client constructors, all reading from the same env vars:

| Client | File | Library | Env Vars | Consumers |
|--------|------|---------|----------|-----------|
| Browser | `src/lib/supabase/client.ts:3-11` | `@supabase/ssr` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 7 browser components |
| Server | `src/lib/supabase/server.ts:5-27` | `@supabase/ssr` | Same via `env()` helper | 52 server files |
| Middleware | `src/lib/supabase/middleware.ts:6-41` | `@supabase/ssr` | Same via `env()` | 1 file (proxy.ts) |
| Service-role | `src/lib/supabase/service-role.ts:14-27` | `@supabase/supabase-js` | Same + `SUPABASE_SERVICE_ROLE_KEY` | 7 files |

**Key insight**: Since Tolom IS the central project, all env vars stay the same. No split needed.

### Service-Role Operation Taxonomy

The service-role client is used in 7 files for two types of operations:

**auth.admin.* operations** (need service-role key):
- `signup/actions.ts:58` — `auth.admin.createUser`
- `members/route.ts:52,79,101` — `auth.admin.listUsers`, `createUser`, `deleteUser`
- `login/actions.ts:50` — `auth.admin.getUserById` (phone-login path)
- `bay-view-actions.ts:479,487` — `auth.admin.listUsers`, `createUser`
- `portal/set-password/route.ts:63` — `auth.admin.createUser`
- `customer/set-password/actions.ts:56,81` — `auth.admin.listUsers`, `createUser`

**DB operations** (need service-role for RLS bypass):
- `signup-service.ts` — 10 `.from(...)` calls across organizations, roles, branches, organization_users, profiles, plus 1 `.rpc()`
- `login/actions.ts:36-40` — `.from("profiles").select` (phone lookup)
- `signup/actions.ts:85` — `.from("profiles").upsert` (phone save)

**Critical**: Two files mix both types on the same client instance:
- `signup/actions.ts` — `auth.admin.createUser` (line 58) + `from("profiles").upsert` (line 85)
- `login/actions.ts` — `from("profiles").select` (line 36) + `auth.admin.getUserById` (line 50)

Since Tolom IS the central project, this mixing is fine — one service-role key serves both.

### Middleware Session Validation

**`getClaims()` at `middleware.ts:34`** — the sole session gate:
- For asymmetric keys (RS256/ES256): fetches JWKS from `${url}/.well-known/jwks.json`, verifies signature locally
- For symmetric keys (HS256): falls through to `getUser()` which hits the auth server
- Does NOT validate the `iss` claim
- If verification fails → `user` is null → redirect to `/auth/login`

**Since Tolom IS the central project**: `getClaims()` fetches JWKS from Tolom's own URL, JWT is signed by Tolom's secret → verification succeeds. No cross-project issues.

### Route Classification

Middleware bypasses auth for these routes (from `auth-routes.ts:28-42`):

| Category | Pattern | Routes |
|----------|---------|--------|
| Public | `startsWith(...)` | `/`, `/features`, `/products`, `/about`, `/contact`, `/faq`, `/blog`, `/status`, `/integrations`, `/services` |
| Auth | `includes("/auth/")` | All auth pages (login, signup, reset, etc.) |
| Portal | `startsWith("/portal")` | All portal pages |
| Pricing | `startsWith("/pricing")` | Pricing pages |
| Invite | `startsWith("/invite/")` | Invite pages |
| Proxy bypass | `proxy.ts:10-12` | `/guide*`, `/invoice/*` |

**Risk**: `includes("/auth/")` is overly broad — a hypothetical `/dashboard/auth-history` would bypass auth. No such route exists today.

**Blast radius if JWT fails**: All 18+ `/dashboard/*` page routes redirect to login. Public, portal, pricing, auth, and invoice routes unaffected.

### Signup Flow — The Auth-to-Domain Seam

`finalizeSignup` at `src/lib/services/signup-service.ts:109-166` is the single point where auth identity becomes Tolom domain state. Called from 3 paths:

| Path | Caller | orgName source |
|------|--------|---------------|
| Eager finalize | `signup/actions.ts:104` | User input |
| OAuth callback | `callback/route.ts:11` | `user_metadata.org_name` |
| Select-org fallback | `select-organization/page.tsx:42` | `user_metadata.org_name` |

**`bootstrapOrganization`** (lines 171-284) performs 7 sequential writes:
1. `organizations` insert
2. `roles` insert (Admin)
3. `roles` insert (Mechanic)
4. `branches` insert (Main Branch)
5. `organization_users` upsert
6. `profiles` upsert
7. `create_default_subscription` RPC

**All tables are Tolom-local**. Since Tolom IS the central project, no changes needed here.

**Idempotency guard** at line 131: checks `organization_users` for existing membership before bootstrapping. Prevents duplicate org creation on retries.

### API Route Auth Pattern

- **80 routes** use `createRouteHandler` (org-scoped, membership gate)
- **12 routes** use `createSimpleRouteHandler` (no org gate)
- **92 total** route files, zero bypass both factories

**`createRouteHandler` flow** (`api-handler.ts:51-80`):
1. Create server Supabase client
2. `getUser()` → validate JWT
3. Extract `orgId` from route params
4. Query `organization_users` → verify membership
5. Execute handler with `{ request, params, orgId, user, supabase }`

**RLS double-check**: Membership verification in the handler + RLS policies on every table. Defense-in-depth pattern established in commit `5fda8c0`.

### Customer Portal Auth

Customers are **Supabase auth.users** in the same project. Two auth paths:
1. **Bearer token** (`portal_token` UUID in `customers` table) — stateless, no login needed
2. **Supabase session** — email/password login → session cookies → `customer_user_id` lookup

**`customer_user_id`** column has `FK → auth.users(id) on delete set null`. Since everything is in one project, this works.

**Portal is middleware-exempt** (`auth-routes.ts:37`): `/portal/*` bypasses the login redirect. Auth enforced at API layer by `createPortalRouteHandler`.

### Post-Login Organization Selection

After auth, middleware redirects to `/auth/select-organization`. Four RPCs handle the flow:

| RPC | File | Purpose |
|-----|------|---------|
| `get_user_organizations` | `00007.sql:17-42` | List user's orgs |
| `set_organization_bay_view_pin` | `00007.sql:91-132` | Hash + store PIN |
| `verify_organization_bay_view_pin` | `00007.sql:141-178` | Verify PIN |
| `set_primary_organization` | `00007.sql:47-88` | Set active org |

**All RPCs hardcode `auth.uid()`** — no explicit user ID parameter. The JWT's `sub` claim must match `auth.uid()` in PostgREST. Since Tolom IS the central project, this works.

### Password Reset Flow

1. `forgot-password/actions.ts:29` — `siteUrl = NEXT_PUBLIC_SITE_URL || "http://localhost:3000"`
2. `resetPasswordForEmail(email, { redirectTo: "${siteUrl}/auth/reset-password" })`
3. Supabase emails recovery link → user clicks → browser exchanges token → session established
4. `reset-password/actions.ts:25` — `updateUser({ password })` → central auth validates JWT → updates password

**Configuration needed**: Central Supabase dashboard must have Tolom's domain in Redirect URLs allowlist. `NEXT_PUBLIC_SITE_URL` must be set to Tolom's production domain.

### Environment Variables

| Variable | Where Used | Current Value |
|----------|-----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All 4 clients | Tolom's project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser, server, middleware | Tolom's anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role only | Tolom's service role key |
| `NEXT_PUBLIC_SITE_URL` | Password reset, sitemap, layouts | Must be set to production domain |

## Code References

- `src/lib/supabase/client.ts:3-11` — Browser client constructor
- `src/lib/supabase/server.ts:5-27` — Server client constructor
- `src/lib/supabase/middleware.ts:6-41` — Middleware client + session gate
- `src/lib/supabase/service-role.ts:14-27` — Service-role client
- `src/lib/supabase/env.ts:3-7` — Shared env helper
- `src/proxy.ts:8-44` — Middleware entry point
- `src/lib/supabase/auth-routes.ts:14-42` — Route classifier
- `src/app/[locale]/auth/login/actions.ts:22-78` — Login action (phone + email paths)
- `src/app/[locale]/auth/signup/actions.ts:44-109` — Signup action
- `src/app/[locale]/auth/callback/route.ts:3-23` — OAuth callback
- `src/lib/services/signup-service.ts:109-284` — finalizeSignup + bootstrapOrganization
- `src/lib/api-handler.ts:51-80` — createRouteHandler factory
- `src/lib/api-handler.ts:95-117` — createSimpleRouteHandler factory
- `src/lib/portal-auth.ts:28-60` — Portal dual-path auth
- `src/lib/services/organization-access-service.ts:57-114` — activateOrganizationAccess
- `src/lib/actions/complete-organization-login.ts:18-44` — Org selection server action
- `src/app/[locale]/auth/forgot-password/actions.ts:14-41` — Password reset initiation
- `src/app/[locale]/auth/reset-password/actions.ts:16-37` — Password update
- `supabase/migrations/00001_phase0_foundation.sql:53-62` — profiles table schema
- `supabase/migrations/00001_phase0_foundation.sql:93-111` — organization_users schema
- `supabase/migrations/00007_org_selector_bay_view_pin.sql:17-42` — get_user_organizations RPC
- `supabase/migrations/20260518000003_customer_portal.sql:8` — portal_token column

## Integration Points

### Inbound References
- `src/proxy.ts:15` — calls `updateSession(request)` from middleware
- `src/lib/api-handler.ts:53-57` — creates server client + `getUser()`
- `src/lib/portal-auth.ts:46-58` — creates server client + `getUser()`
- All 92 API route files — import from `api-handler.ts` or `portal-auth.ts`
- All auth page actions — import from `supabase/server.ts` and `supabase/service-role.ts`

### Outbound Dependencies
- `@supabase/ssr` (v0.10.3) — browser, server, middleware clients
- `@supabase/supabase-js` — service-role client
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase project endpoint
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase service role key

### Infrastructure Wiring
- `src/proxy.ts:44` — matcher: `/((?!api|trpc|_next|_vercel|.*\\..*).*)`
- `src/lib/supabase/auth-routes.ts:14-42` — route classification
- Supabase dashboard → Authentication → Providers (Google OAuth)
- Supabase dashboard → Authentication → URL Configuration (redirect URLs)
- Supabase dashboard → Authentication → Email Templates (SMTP config)

## Architecture Insights

1. **Tolom IS the central project** — zero migration needed. All env vars stay the same.
2. **Login app is a separate Next.js app** — connects to Tolom's Supabase with the same URL + anon key.
3. **The `profiles` table FK to `auth.users(id)`** works because everything is in one project.
4. **All RPCs hardcode `auth.uid()`** — works because JWT is from the same project.
5. **RLS policies use `get_user_organization_id()`** → `auth.uid()` → `organization_users` — standard pattern, no changes needed.
6. **Service-role mixing is safe** — one key serves both auth.admin.* and DB operations.
7. **The middleware auth gate is the highest-risk component** — 50% fix rate across past commits. Every new public page requires manual route classifier updates.

## Precedents & Lessons

### Precedent: Auth Route Migration (Non-locale → [locale] tree)
**Commit(s)**: `7b8bea6` — "Schema drift fix" (2026-05-13)
**Blast radius**: 142 files across 8+ layers
**Follow-up fixes**: `cd30631` (pricing blocked), `ba86bbb` (invoice 404), `fe728e4` (locale normalization)
**Takeaway**: Auth route restructuring triggers cascading middleware fixes. Every public route exception must be manually maintained.

### Precedent: Security Hardening (Org Membership Check)
**Commit(s)**: `5fda8c0` — "add org membership check, portal rate limiting" (2026-05-27)
**Blast radius**: 3 files across 2 layers
**Follow-up fixes**: `a8221d5` (signup simplification next day)
**Takeaway**: API handler org membership checks are mandatory even when RLS exists.

### Precedent: Signup Flow Iteration (3 commits in 2 days)
**Commits**: `ac0d131`, `a8221d5`, `f5207ce` (2026-05-17 to 2026-05-28)
**Takeaway**: Signup is the most iterated auth component. Key gotchas: React Strict Mode double-fire, idempotency on retries, org slug security.

### Precedent: Middleware Public Route Gate (Most Fragile)
**Commits**: 6 total, 3 were bug fixes (50% fix rate)
**Takeaway**: The middleware auth gate is the #1 fragile area. Decompose route-matching from session-refresh before adding complexity.

### Composite Lessons
1. **Middleware auth gate is highest-risk** — 50% fix rate. Every new page requires exception list update.
2. **Signup requires idempotency by design** — React Strict Mode, retries, concurrent requests all caused real bugs.
3. **RLS is defense-in-depth, not primary auth** — all data access goes through server-side API routes with explicit `getUser()` checks.
4. **`select(*)` leaks data** — commit `0cd74a2` fixed this in portal-auth. Always use explicit columns.
5. **Rate limiter is in-memory** — `src/lib/rate-limit.ts` uses a `Map` that resets on Vercel cold starts. Replace with Redis/Upstash before production.
6. **Auth paths must include locale prefix** — three separate commits fixed locale-related redirect bugs.

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/discover/2026-05-30_01-03-44_centralized-auth.md` — FRD with all decisions (centralized auth scope, auth methods, constraints)

## Developer Context

**Q (discover: Single project): Which architecture?**
A: Tolom's existing Supabase project IS the central project. Zero migration. All env vars stay the same.

**Q (discover: Tolom data): What to do with Tolom's data?**
A: Keep it local. Since Tolom IS the central project, no migration needed.

**Q (Resolved conflict): Single project vs. keep data local?**
A: Tolom's Supabase = the central project. Login app connects to it. Future projects also connect to it.

## Related Research
- None (first research artifact)

## Open Questions
- How does the login app handle Tolom-specific signup flows (org creation)? The login app registers users generically; Tolom's finalizeSignup runs separately when the user first accesses Tolom.
- Should the login app have its own signup page, or should users always register through a specific project's flow?
- What is the login app's deployment target? (Vercel, Railway, Cloudflare Pages?)
