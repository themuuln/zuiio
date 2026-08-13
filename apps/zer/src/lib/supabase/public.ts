import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Fetch wrapper that declares an explicit cache policy for Next.js Cache
 * Components / PPR prerenders.
 *
 * supabase-js fetches carry no cache policy. During a prerender Next's
 * patched fetch treats them as dynamic and returns a hanging promise that
 * rejects at prerender teardown ("During prerendering, fetch() rejects...").
 * An explicit `next.revalidate` makes the fetch cacheable: it executes during
 * the prerender and its result lands in the fetch cache. Cache keys include
 * request headers, so anon fetches never leak into authed requests.
 *
 * This is a stable contract — the same pattern ships in onoo
 * (`src/lib/supabase/public.ts`, `createPrerenderSafeFetch`) and is covered
 * by tests in both apps. Do not inline it at call sites.
 */
export function createPrerenderSafeFetch(revalidate: number) {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    fetch(input, { ...init, next: { revalidate } });
}

/**
 * Cookieless anon client for public storefront data. Safe to use from
 * prerendered (PPR / partial-prefetch) contexts: no session is read or
 * written, and every fetch carries an explicit revalidate policy.
 *
 * Do NOT use this for authed/admin queries — those need the cookie-aware
 * `createClient` from `./server` (fresh data, never cached).
 */
export function createPublicClient(revalidate = 60) {
  const { anonKey, url } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    global: {
      fetch: createPrerenderSafeFetch(revalidate),
    },
  });
}
