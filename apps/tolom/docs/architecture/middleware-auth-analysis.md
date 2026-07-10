# Architecture Analysis: Middleware & Auth Flow

> Generated: 2026-05-12
> Analysis of the request pipeline: proxy.ts → middleware → intl → auth → session.

---

## 1. Request Pipeline

```
Incoming Request
  │
  ├── proxy.ts (root middleware)
  │     ├── Rate limiting on auth routes
  │     ├── Session update via supabase/middleware.ts
  │     └── Intl middleware for non-API routes
  │
  ├── Next.js App Router
  │     ├── Locale layout ([locale]/layout.tsx)
  │     │     └── QueryProvider, NextIntlClientProvider, Toaster
  │     └── Dashboard layout (dashboard/layout.tsx)
  │           └── useRequireAuth() → client-side auth check
  │
  └── API Routes
        └── Each calls createClient() → supabase.auth.getUser()
```

---

## 2. proxy.ts Analysis

File: `src/proxy.ts` (root-level middleware)

This is a **well-structured middleware** that handles three concerns:

### Concern 1: Rate Limiting
- In-memory Map-based limiter: 5 req/min per IP
- Only applies to auth routes (login, signup, forgot-password, reset-password)
- Returns 429 with Retry-After header when exceeded

### Concern 2: Session Refresh
- Delegates to `src/lib/supabase/middleware.ts` (`updateSession()`)
- Calls `supabase.auth.getClaims()` to verify session
- Redirects unauthenticated users to `/auth/login`
- Redirects authenticated users away from `/auth/login`

### Concern 3: Internationalization
- Uses `next-intl/middleware` for locale detection + redirect
- API routes skip intl middleware (already localized or locale-agnostic)

### Friction Points

| Issue | Detail | Impact |
|-------|--------|--------|
| **Three concerns in one function** | Rate limiting, intl, auth session | All three are independent — if one fails, all fail. Testability is harder. |
| **Rate limiter is in-memory** | Doesn't persist across Vercel cold starts | Won't work in production with multiple instances |
| **Auth routes hardcoded** | Set of strings includes both `/[locale]` and non-locale versions | If a new auth route is added and not in the set, it's not rate-limited |
| **No auth on API routes** | Authenticated internally via `supabase.auth.getUser()` | Every API route duplicates auth check |
| **Duplicate auth redirect paths** | Middleware redirects to `/auth/login`, but the `/auth/login` page exists at both `app/[locale]/auth/login` and `app/auth/login` | Depends on which tree is live |

---

## 3. Session Management

File: `src/lib/supabase/middleware.ts` (`updateSession()`)

```typescript
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Redirect logic...
  return supabaseResponse;
}
```

**Good:** Follows Supabase SSR best practices exactly. Cookie handling is correct.

**Friction:** The middleware only checks `getClaims()` (JWT claims) — it does NOT verify with `getUser()` (which makes a DB call). This is the correct trade-off for performance but means revoked sessions won't be caught until the JWT expires.

---

## 4. Client-Side Auth

### useRequireAuth Hook

File: `src/hooks/use-require-auth.ts`

```typescript
export function useRequireAuth() {
  useEffect(() => {
    fetch("/api/profile").then((res) => {
      if (res.status === 401 && res.headers.get("X-Auth-Required") === "true") {
        redirectToLogin();
      }
    });
  }, []);
}
```

This runs in the dashboard layout. It's a **belt-and-suspenders** approach alongside the middleware — the middleware handles the redirect for initial page loads, and the hook catches cases where the session expires while the user is already on the page (SPA navigation without full page reload).

### auth-redirect.ts

File: `src/lib/auth-redirect.ts`

Provides `redirectToLogin()` and `handleAuthRedirect(response)` — the latter checks for the `X-Auth-Required: true` header that `handleApiError` sets on 401 responses.

**Good:** Consistent auth redirect mechanism that works in both middleware and client.

---

## 5. Duplicate Auth Trees

### The Problem

There are **two auth page trees**:

```
src/app/auth/                          src/app/[locale]/auth/
├── login/page.tsx                     ├── login/page.tsx
├── signup/page.tsx                    ├── signup/page.tsx
├── forgot-password/page.tsx           ├── forgot-password/page.tsx
├── reset-password/page.tsx            ├── reset-password/page.tsx
├── callback/route.ts                  ├── callback/route.ts
├── select-organization/page.tsx        ├── select-organization/page.tsx
└── confirm-email/page.tsx             └── confirm-email/page.tsx
```

The middleware redirects to `/auth/login` (non-locale), but the `select-organization` page is at `app/[locale]/auth/select-organization`. When a user logs in, the flow is:

1. Middleware sees authenticated user on login page
2. Redirects to `/{locale}/auth/select-organization`
3. User selects org, enters PIN
4. Redirects to `/{locale}/dashboard/bay-view`

**But:** The non-locale `/auth/select-organization` route also exists at `src/app/auth/select-organization/page.tsx`. If middleware sends them there, they get the non-locale page, which may not have translations working correctly.

**Risk:** If the non-locale auth tree is still accessible, users on the wrong path may hit bugs related to missing locale context. The non-locale pages are likely leftovers from before i18n was added.

---

## 6. Auth Service Layer

### organization-access-service.ts

File: `src/lib/services/organization-access-service.ts`

Handles:
- `listUserOrganizations()` — uses RPC `get_user_organizations`
- `activateOrganizationAccess()` — PIN verification/setting via RPC

**Good:** Clean separation between auth middleware (session management) and auth services (org access). The RPC calls encapsulate the PIN logic in the database.

### actions/complete-organization-login.ts

File: `src/lib/actions/complete-organization-login.ts`

A server action wrapper around `activateOrganizationAccess`. This is one of the few server actions that actually delegates to a service instead of querying the database directly.

---

## 7. API Route Auth Pattern

Every API route follows this pattern:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
```

**count:** This appears in ~25 route files.

**Cost:** Each route creates a Supabase client (cookie parsing), calls `getUser()` (DB roundtrip for session verification via auth.users table), then proceeds. The middleware already verified the JWT via `getClaims()`. There's a **redundant DB call** on every API request.

**Potential optimization:** Use `getClaims()` in API routes instead of `getUser()` — same approach as the middleware. The JWT is already verified by the middleware. Only use `getUser()` when the user's DB state matters (e.g., checking if account is active).

---

## 8. RLS (Row Level Security)

Based on the migration `00011_work_orders_rls_policies.sql`, RLS is enabled on all public tables. The AGENTS.md says RLS must be enabled on every table.

**Observation:** RLS is the *primary* auth enforcement mechanism for Supabase client queries. But TOLOM uses server-side API routes and services for *all* data access (no direct browser-to-DB queries), so RLS is a defense-in-depth layer rather than the primary gate.

**Architecture implication:** Since all data access goes through API routes → services which already check auth via `getUser()`, RLS is a safety net that catches bugs where org_id filtering is missed.

---

## 9. Recommendations

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P1** | Non-locale auth tree cleanup | Medium | Prevents routing bugs in auth flow |
| **P1** | Rate limiter scalability flag | Flag | Won't work across Vercel instances |
| **P2** | API route redundant `getUser()` calls | Medium | Performance (1 DB roundtrip per API call) |
| **P3** | Middleware decomposition | Medium | Separate concerns (rate limit, intl, auth) |
| **P3** | Use `getClaims()` in API routes | Small | Eliminates redundant DB calls |
| **Context** | RLS vs. server-side auth | Monitor | RLS is defense-in-depth, which is correct |
