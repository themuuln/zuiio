import { createServerClient } from "@supabase/ssr";
import { withSupabaseConsoleCapture } from "@zuiio/capture";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";
import { env, getSupabaseKey } from "./env";

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // During prerendering with Cache Components, cookies() rejects when the
    // prerender is complete. Return a client with a noop fetch that resolves
    // synchronously to an empty JSON response — supabase's internal _useSession
    // calls fetch() which would otherwise outlive the prerender and cause
    // HANGING_PROMISE_REJECTION.
    //
    // Env vars may also be missing during build-time prerendering — return a
    // noop client that won't make real API calls.
    const noopFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ data: { user: null }, error: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    let supabaseUrl: string;
    let supabaseKey: string;
    try {
      supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
      supabaseKey = getSupabaseKey();
    } catch {
      // Build-time prerender without env vars — return a noop client.
      return createServerClient<Database>(
        "https://placeholder.supabase.co",
        "placeholder",
        {
          cookies: { getAll() { return []; }, setAll() {} },
          global: { fetch: noopFetch },
        },
      );
    }

    return createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
      global: { fetch: noopFetch },
    });
  }

  return createServerClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabaseKey(),
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Ignored — middleware handles session refresh.
          }
        },
      },
      global: {
        fetch: withSupabaseConsoleCapture(),
      },
    },
  );
}
