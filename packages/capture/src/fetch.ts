/**
 * Wraps the native fetch to log Supabase HTTP errors to console.
 *
 * Drop this into Supabase client creation to get automatic `console.error`
 * for every failed Supabase request — no per-query wrapping needed.
 *
 * Usage:
 *   createServerClient(url, key, {
 *     cookies: { ... },
 *     global: { fetch: withSupabaseConsoleCapture() },
 *   })
 */

export function withSupabaseConsoleCapture(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, init);

    if (!response.ok) {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      console.error(
        `\x1b[31m[supabase] ${response.status} ${response.statusText} — ${url}\x1b[0m`,
      );
    }

    return response;
  };
}
