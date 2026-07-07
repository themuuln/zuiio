# @zuiio/capture — Unified Error Capture

Framework-agnostic error capture layer. Apps register a Sentry handler once; everything else just calls `capture()`.

## Setup (once per app)

```ts
// sentry.client.config.ts or app initialization
import { setCaptureHandler } from "@zuiio/capture";
import * as Sentry from "@sentry/nextjs";

setCaptureHandler((error, ctx) => {
  Sentry.captureException(error, { extra: ctx });
});
```

When no handler is set, errors still surface via `console.error()` — safe to use before Sentry initializes.

## Exports

| Export | Description |
|---|---|
| `setCaptureHandler(fn \| null)` | Register telemetry transport (Sentry, Datadog, etc.). Call once at init. |
| `capture(error, ctx?)` | Report any error to the handler; falls back to `console.error`. |
| `captureDbError(cause, queryLabel, error, ctx?)` | Capture a Supabase query error with structured tags (`db_cause`, `context`). |
| `captureRedirectLoop(path, count, userId?)` | Capture redirect-loop detection as an error. |
| `CaptureContext` | `Record<string, unknown> & { context?: string }` — extra metadata for every call. |
| `withDbCapture(label, promise, ctx?)` | Wrap a Supabase query — auto-captures on `result.error` or exception. Returns same `{ data, error }`. |
| `withSupabaseConsoleCapture()` | Returns a `fetch` wrapper that logs non-OK Supabase responses to `console.error`. |

## Usage

### Generic error capture

```ts
import { capture } from "@zuiio/capture";

await capture(error, { context: "Dashboard profile query" });
```

### Supabase queries (preferred over manual try/catch)

`withDbCapture` wraps any Supabase query and automatically reports `result.error` or thrown exceptions:

```ts
import { withDbCapture } from "@zuiio/capture";

const { data, error } = await withDbCapture(
  "getProfile",
  supabase.from("profiles").select("*").single(),
  { orgId },
);
```

This replaces repetitive `if (error) console.error(...)` blocks — every query gets consistent error reporting.

### Supabase client fetch logging

Drop into `createServerClient` to log all non-OK Supabase HTTP responses automatically:

```ts
import { withSupabaseConsoleCapture } from "@zuiio/capture";

const supabase = createServerClient(url, key, {
  cookies: { ... },
  global: { fetch: withSupabaseConsoleCapture() },
});
```

### Redirect loop detection

```ts
import { captureRedirectLoop } from "@zuiio/capture";

if (redirectCount > 5) {
  await captureRedirectLoop(path, redirectCount, userId);
}
```

## Conventions

- Replace `console.error(err)` in error paths with `capture(err, { context: "..." })`.
- Use `withDbCapture` for every Supabase query — no manual try/catch.
- Never call Sentry directly — go through this package so the handler stays swappable.
