/**
 * Returns the Supabase URL and anon key from environment variables.
 * Expo requires EXPO_PUBLIC_ prefix for client-accessible env vars.
 */
export function getSupabaseEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL",
    );
  }

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "Missing required environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return { url, anonKey };
}
