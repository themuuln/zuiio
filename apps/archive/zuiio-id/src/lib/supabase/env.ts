/**
 * Returns the Supabase URL and publishable key from environment variables.
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

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return { url, anonKey };
}

/**
 * Returns the Supabase service-role key for server-only admin operations.
 * Never exposed to the client bundle.
 */
export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return key;
}
