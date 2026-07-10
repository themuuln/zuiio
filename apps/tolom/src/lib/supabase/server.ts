import { createServerClient } from "@supabase/ssr";
import { withSupabaseConsoleCapture } from "@zuiio/capture";
import { cookies } from "next/headers";
import { reportServerError } from "@/lib/sentry-report-server";
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
    reportServerError("Unexpected error");
    // During prerendering with Cache Components, cookies() rejects when the
    // prerender is complete. Return a client with empty cookies — auth will fail
    // gracefully (UnauthorizedError), which is correct for prerendered routes.
    return createServerClient<Database>(
      env("NEXT_PUBLIC_SUPABASE_URL"),
      getSupabaseKey(),
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
        global: {
          fetch: withSupabaseConsoleCapture(),
        },
      },
    );
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
            reportServerError("Unexpected error");
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            reportServerError("Unexpected error");
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
