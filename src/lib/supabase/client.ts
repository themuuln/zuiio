import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseKey)
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
