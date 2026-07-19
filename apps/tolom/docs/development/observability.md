# Tolom Observability

## Error Capture

Every error must be captured, never silently swallowed.

```ts
import { reportServerError } from "@/lib/sentry-report-server";

// In catch blocks:
catch (e) { reportServerError('my_func', e); }

// For Supabase queries:
const { data, error } = await supabase.from('products').select('*');
if (error) { reportServerError('products_query', error); return apiError('QUERY_ERROR', error.message, 500); }
```

## Where Errors Appear

| Source | How to check |
|--------|-------------|
| `pnpm dev` terminal | Look for `[capture]` lines |
| Sentry dashboard | `sentry.io` (production) |
| Browser DevTools | Console + Network tabs |

## Debugging Checklist

1. Check `pnpm dev` terminal for error lines
2. Check Supabase logs
3. Check browser console + network tab
