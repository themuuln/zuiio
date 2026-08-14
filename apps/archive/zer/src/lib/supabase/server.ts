import { createServerClient } from "@supabase/ssr";
import { withSupabaseConsoleCapture } from "@zuiio/capture";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Shape of next/headers cookies() in Next 16.3. Next does not export the
 * concrete type, so we name it here and use it in the client handlers.
 */
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function createClient() {
  const { anonKey, url } = getSupabaseEnv();

  let cookieStore: CookieStore | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // During prerendering (PPR / Cache Components) cookies() rejects when the
    // prerender terminates. React.cache would memoize the rejected promise
    // and poison every later request — fall back to an empty cookie store.
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore?.getAll() ?? [];
        } catch {
          // During prerendering with Cache Components, cookie access after
          // prerender terminates throws. Return empty — no real request during prerender.
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore?.set(name, value, options);
          }
        } catch {
          // Called from Server Component — ignore (Next.js handles)
        }
      },
    },
    global: {
      fetch: withSupabaseConsoleCapture(),
    },
  });
}
