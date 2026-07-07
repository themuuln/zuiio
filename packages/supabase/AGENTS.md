# @zuiio/supabase

Supabase utilities for server-side operations. Provides auth helpers, query wrappers, storage utilities, and error handling.

## Exports

| Module | Description |
|--------|-------------|
| `auth` | Server-side auth helpers (getSession, getUser, etc.) |
| `errors` | Supabase error handling and sanitization |
| `query` | Query helpers (withDbCapture, paginate, etc.) |
| `storage` | Storage upload/download helpers |

## Usage

### Server auth

```ts
import { getSession, getUser } from "@zuiio/supabase/auth";

// Get current session (server-side)
const session = await getSession(supabase);

// Get current user (throws if not authenticated)
const user = await getUser(supabase);
```

### Error handling

```ts
import { sanitizeDbError, isRLSError } from "@zuiio/supabase/errors";

const { data, error } = await supabase.from("table").select("*");

if (error) {
  // Sanitize for user-facing messages
  const message = sanitizeDbError(error);
  // "Датаны алдаа" (not raw PostgREST error)
  
  // Check if it's an RLS error
  if (isRLSError(error)) {
    // Handle permission denied
  }
}
```

### Query helpers

```ts
import { withDbCapture } from "@zuiio/supabase/query";

// Auto-capture Supabase errors (best practice)
const { data, error } = await withDbCapture("getProfile",
  supabase.from("profiles").select("*").single()
);

// Error is logged to Sentry automatically
// No need for manual capture() calls
```

### Storage

```ts
import { uploadImage, downloadFile } from "@zuiio/supabase/storage";

// Upload with automatic optimization
const url = await uploadImage(supabase, "avatars", file, {
  maxWidth: 800,
  quality: 0.8,
});

// Download file
const blob = await downloadFile(supabase, "documents", "file.pdf");
```

## Dependencies

- `@supabase/supabase-js` — Supabase client

## Notes

- Server-side only — use `@zuiio/auth` for client-side auth
- Always use `withDbCapture()` for queries — catches silent RLS errors
- `sanitizeDbError()` returns Mongolian error messages
