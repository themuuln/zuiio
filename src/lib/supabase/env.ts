/**
 * Read a required environment variable. Throws if missing.
 * Shared across all Supabase client modules.
 */
export function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

/**
 * Get the Supabase anon/publishable API key.
 * Prefers the publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 * but falls back to the legacy anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * for compatibility with Vercel's Supabase integration, which only
 * auto-sets NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing Supabase API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return key;
}
