# @zuiio/capture

Unified error capture layer — framework-agnostic. Apps register a Sentry handler once; everything else just calls `capture()`.

## Setup (once per app)

```ts
import { setCaptureHandler } from "@zuiio/capture";
import * as Sentry from "@sentry/nextjs";
setCaptureHandler((error, ctx) => {
  Sentry.captureException(error, { extra: ctx });
});
```

## Exports

| Export | Description |
|---|---|
| `setCaptureHandler(fn \| null)` | Register telemetry transport (Sentry). Call once at init. |
| `capture(error, ctx?)` | Report any error to the handler; falls back to `console.error`. |
| `captureDbError(cause, queryLabel, error, ctx?)` | Capture a Supabase query error with structured tags. |
| `captureRedirectLoop(path, count, userId?)` | Capture redirect-loop detection. |
| `CaptureContext` | `Record<string, unknown> & { context?: string }` — extra metadata for every call. |
| `withDbCapture(label, promise, ctx?)` | Wrap a Supabase query — auto-captures on `result.error` or exception. Returns same `{ data, error }`. |
| `withSupabaseConsoleCapture()` | Returns a `fetch` wrapper that logs non-OK Supabase responses. Pass as `global.fetch` in `createServerClient`. |

## Quick patterns

```ts
// Generic error
await capture(e, { context: "Dashboard load" });

// Supabase query (preferred over manual try/catch)
const { data, error } = await withDbCapture("getProfile",
  supabase.from("profiles").select("*").single(), { orgId });

// Supabase client fetch logging
createServerClient(url, key, { global: { fetch: withSupabaseConsoleCapture() } });
```

## Conventions

- Replace `console.error(err)` in error paths with `capture(err, { context: "..." })`.
- Use `withDbCapture` for every Supabase query — no manual try/catch.
- Never call Sentry directly — go through this package so the handler stays swappable.
