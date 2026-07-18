import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // During static generation, env vars may not be available.
    // Return a dummy client that will fail gracefully at runtime.
    return createBrowserClient("https://placeholder.supabase.co", "placeholder");
  }
  client = createBrowserClient(url, key);
  return client;
}
