# Zer Debugging Guide

## How to Capture Errors

```ts
import { capture, captureDbError, withDbCapture } from "@zuiio/capture";

// Generic error capture (console.error + Sentry)
capture(error, { context: "Dashboard profile query" });

// Supabase query error with structured tags
captureDbError("missing_column", "getProfile", error);

// Auto-capture Supabase query errors (best — catches every path)
const { data, error } = await withDbCapture("getProfile",
  supabase.from("profiles").select("*").single()
);
```

**Every Supabase query should use `withDbCapture()`** — it's the only way to guarantee errors aren't silently swallowed when the caller only destructures `{ data }`.

## Where Errors Appear

| Source | When | How to check |
|--------|------|-------------|
| `pnpm dev` terminal | Immediately | Look for `[capture]` lines |
| `.next/dev/logs/next-development.log` | Immediately | `cat .next/dev/logs/next-development.log \| grep "\[capture\]"` |
| Sentry dashboard | Production | `sentry.io` — requires `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` |
| Browser DevTools | Client-side errors | Console tab in browser |

## Redirect Loop Protection

The proxy middleware (`src/lib/supabase/proxy.ts`) detects repeated redirects and breaks the loop after 3 attempts within 30 seconds.

## Org Settings Safety

`checkOrgSetting()` in `src/lib/org-settings.ts` returns `false` (feature denied) on query failure — a missing column will NOT silently enable every feature.

## Debugging Checklist

1. Check `pnpm dev` terminal for `[capture]` lines
2. Check Supabase logs
3. Check browser console + network tab
4. Check Sentry dashboard (if production)
