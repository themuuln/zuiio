# Proxy Early-Exit for Unauthenticated Requests

## Context
The proxy (`src/proxy.ts`) runs on every non-static request and calls `supabase.auth.getClaims()` — even for unauthenticated users visiting public routes like `/login`, `/signup`, `/forgot-password`. This wastes ~50-100ms per request by creating a Supabase client and attempting JWT validation when no session cookie exists.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `src/proxy.ts` | Modify | Add early return when no session cookie is present |

## Implementation
1. After creating the Supabase client, check if any auth-related cookie exists (Supabase uses `sb-<ref>-auth-token` pattern)
2. If no session cookie → return `supabaseResponse` immediately (skip `getClaims()`)
3. If session cookie exists → proceed with `getClaims()` as before

## Edge Cases
- **No cookie at all** (unauthenticated public route) → early return, skip JWT validation ✅
- **Expired cookie** (stale session) → cookie still exists, `getClaims()` runs and handles refresh/clear ✅
- **Valid cookie** (authenticated user) → cookie exists, `getClaims()` runs normally ✅
- **API routes needing RLS** → most API routes that need auth will have a session cookie; public API routes (like `/api/health`) already skip auth in their handlers

## Verification
1. `pnpm typecheck` — no new errors
2. `pnpm lint` — passes
3. Dev server: measure TTFB on `/forgot-password` before and after (expect ~30-100ms improvement)
4. Dev server: verify `/account` still works for authenticated users
