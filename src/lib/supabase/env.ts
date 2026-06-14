/**
 * Returns the Supabase URL and anon key from environment variables.
 *
 * Uses explicit `process.env.NEXT_PUBLIC_*` references (not an indirect
 * wrapper) so that Next.js / Turbopack can statically inline the values
 * into the client bundle during compilation.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  return {
    url,
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      (() => {
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!key) {
          throw new Error(
            "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
          );
        }
        return key;
      })(),
  };
}
