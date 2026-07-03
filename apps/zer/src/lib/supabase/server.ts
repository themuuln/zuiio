import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import { withSupabaseConsoleCapture } from "@zuiio/capture";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  const { anonKey, url } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
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
