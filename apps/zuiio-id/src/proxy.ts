import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Supabase Auth session-refresh proxy.
 *
 * Server Components cannot reliably persist refreshed auth tokens because
 * they cannot write response headers. This Proxy runs on every navigation
 * to:
 *
 * 1. Create a request-scoped Supabase server client that reads the session
 *    cookie from the incoming request.
 * 2. Call `getClaims()` to trigger a token refresh if the access token is
 *    expired. (Supabase's asymmetric JWK keys let this validate locally
 *    with WebCrypto — no network round-trip.)
 * 3. Write refreshed cookies onto both the request (for Server Components)
 *    and the response (for the browser).
 * 4. Apply `Cache-Control` / `Expires` / `Pragma` headers from the cookie
 *    `setAll` callback so CDNs never cache auth-impregnated responses.
 *
 * Never trust `supabase.auth.getSession()` inside the Proxy — it doesn't
 * re-validate the JWT. Always use `getClaims()` for identity decisions.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export async function proxy(request: NextRequest) {
  const { url: supabaseUrl, anonKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

 // In production, share cookies across all zuiio.com subdomains
 const isProduction = process.env.NODE_ENV === "production";
 const cookieDomain = isProduction ? ".zuiio.com" : undefined;

 const supabase = createServerClient(supabaseUrl, anonKey, {
   cookies: {
     getAll() {
       return parseCookieHeader(request.cookies.toString()).map(
         (c) => ({ name: c.name, value: c.value ?? "" }),
       );
     },
     setAll(cookiesToSet, headers) {
       // Prevent CDNs from caching responses that carry auth tokens
       if (headers) {
         for (const [key, value] of Object.entries(headers)) {
           supabaseResponse.headers.set(key, value);
         }
       }

       for (const { name, value, options } of cookiesToSet) {
         supabaseResponse.cookies.set(name, value, {
           ...options,
           domain: cookieDomain ?? options.domain,
         });
       }
     },
   },
 });

  // IMPORTANT: `getClaims()` triggers token refresh and validates the JWT
  // against the project's published public keys (local WebCrypto when
  // asymmetric keys are used). This ensures Server Components always see
  // a valid session.
  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match everything except static assets, public files, and API routes
    // that don't need auth (e.g., public webhooks).
    // API routes are intentionally included — they often need a valid
    // session for Supabase RLS policies.
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
