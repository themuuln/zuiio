# Fix: Remove Duplicate Auth Page Tree

> Generated: 2026-05-12
> Removed `src/app/auth/` (non-locale), kept `src/app/[locale]/auth/` (locale-prefixed) as canonical.

## Files Deleted (13)

| File | Notes |
|------|-------|
| `src/app/auth/layout.tsx` | Replaced by `[locale]/auth/layout.tsx` (has locale-aware UI) |
| `src/app/auth/login/page.tsx` | Replaced by `[locale]/auth/login/page.tsx` |
| `src/app/auth/login/actions.ts` | Replaced by `[locale]/auth/login/actions.ts` |
| `src/app/auth/signup/page.tsx` | Replaced by `[locale]/auth/signup/page.tsx` |
| `src/app/auth/signup/actions.ts` | Replaced by `[locale]/auth/signup/actions.ts` |
| `src/app/auth/forgot-password/page.tsx` | Replaced by `[locale]/auth/forgot-password/page.tsx` |
| `src/app/auth/forgot-password/actions.ts` | Replaced by `[locale]/auth/forgot-password/actions.ts` |
| `src/app/auth/reset-password/page.tsx` | Replaced by `[locale]/auth/reset-password/page.tsx` |
| `src/app/auth/reset-password/actions.ts` | Replaced by `[locale]/auth/reset-password/actions.ts` |
| `src/app/auth/confirm-email/page.tsx` | Replaced by `[locale]/auth/confirm-email/page.tsx` |
| `src/app/auth/select-organization/page.tsx` | Replaced by `[locale]/auth/select-organization/page.tsx` |
| `src/app/auth/callback/route.ts` | Replaced by `[locale]/auth/callback/route.ts` |
| `src/app/auth/signout/route.ts` | Replaced by `[locale]/auth/signout/route.ts` |

## Middleware Changes

### `src/middleware.ts`
- Removed 6 locale-prefixed entries from `AUTH_ROUTES` set (`/mn/auth/*`, `/en/auth/*`). These are internal rewrite paths that never match incoming requests — the intl middleware handles locale detection before rate limiting runs.

### `src/lib/supabase/middleware.ts` (`updateSession`)
- Changed auth redirect fallbacks from non-locale (`/auth/login`, `/auth/select-organization`) to default locale (`/{defaultLocale}/auth/...`)
- Added `defaultLocale = locale ?? "mn"` — always redirects to `/mn/auth/...` when no locale detected (edge case for first request without cookie/header)
- Affects both: unauthenticated redirect to login, and post-login redirect to org selection

## Why This Works

With `localePrefix: "never"` in the intl config:
1. Incoming requests don't have locale in URL (e.g., `/auth/login`)
2. The intl middleware internally rewrites to locale paths (`/mn/auth/login`)
3. `updateSession` sees the rewritten path with locale prefix
4. The `[locale]/auth/` tree serves all locale variants
5. The non-locale `auth/` tree was never reached — intl middleware always rewrites

## Verification

- `npx tsc --noEmit` → 0 errors (after clearing `.next` cache)
- No runtime imports from `src/app/auth/` found in any TypeScript source
