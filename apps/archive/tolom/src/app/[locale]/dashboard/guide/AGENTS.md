# Guide (Dashboard)

**Purpose:** Redirects to the top-level `/guide` route — no content is served from this path.

## File Structure

```
guide/
├── page.tsx    # Server component — redirects to /guide
├── error.tsx   # Error boundary — Sentry report, Mongolian error text
└── loading.tsx # Loading spinner (centered, animated border)
```

## Key Components

- `GuideRedirect` — Server component that calls `redirect("/guide")`. No client-side rendering.
- `ErrorPage` — Error boundary with hardcoded Mongolian text ("Алдаа гарлаа" / "Уучлаарай, системийн алдаа гарлаа"). Reports to Sentry under context `"dashboard/guide"`.
- `Loading` — Centered spinning border animation.

## Data Flow

- No API calls or data fetching. The page immediately redirects.
- Error and loading states exist as safety nets but should rarely trigger since the redirect is instant.

## State Management

- None. Server-side redirect, no client state.

## Conventions

- Error messages are hardcoded in Mongolian (not i18n). This is inconsistent with the rest of the app which uses `useTranslations`.
- The redirect pattern (`redirect("/guide")`) is a Next.js server-side redirect — it returns a 307 response.

## Dependencies

- `redirect` from `next/navigation`
- `reportError` from `@/lib/sentry-report`
- Sub-route of dashboard — inherits auth, sidebar, and brand theme from dashboard layout, but the redirect fires before any dashboard UI renders.
