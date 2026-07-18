import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function initClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("http")) {
    throw new Error(
      "Missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, key);
}

export function createClient(): SupabaseClient {
  if (client) return client;
  // During prerendering (Node.js), defer initialization to first use
  if (typeof window === "undefined") {
    // Return a proxy that initializes on first method call
    return new Proxy({} as SupabaseClient, {
      get(_target, prop, receiver) {
        if (!client) client = initClient();
        const value = Reflect.get(client, prop, receiver);
        if (typeof value === "function") {
          return value.bind(client);
        }
        return value;
      },
    });
  }
  client = initClient();
  return client;
}
