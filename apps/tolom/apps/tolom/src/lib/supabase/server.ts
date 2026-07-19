import { createServerClient } from "@supabase/ssr";
import { withSupabaseConsoleCapture } from "@zuiio/capture";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";
import { env, getSupabaseKey } from "./env";

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */

/** Check whether the Supabase env vars are available (may be missing during CI build). */
function hasSupabaseEnv(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url?.startsWith("http")) return false;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) return false;
    return true;
  } catch {
    return false;
  }
}

/** Build a noop client for prerendering — returns empty data without hitting Supabase. */
function createNoopClient(): ReturnType<typeof createServerClient<Database>> {
  const noopFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ data: { user: null }, error: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  return createServerClient<Database>(
    "https://placeholder.supabase.co",
    "placeholder",
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      global: { fetch: noopFetch },
    },
  );
}

export async function createClient() {
  // During build-time prerendering, env vars may be missing. Return a noop
  // client so pages can prerender without hitting real Supabase.
  if (!hasSupabaseEnv()) {
    return createNoopClient();
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // During prerendering with Cache Components, cookies() rejects when the
    // prerender is complete. Return a client with a noop fetch that resolves
    // synchronously to an empty JSON response — supabase's internal _useSession
    // calls fetch() which would otherwise outlive the prerender and cause
    // HANGING_PROMISE_REJECTION.
    return createNoopClient();
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
