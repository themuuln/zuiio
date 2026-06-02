import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey } from "./env";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = getSupabaseKey();

if (!supabaseUrl) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
