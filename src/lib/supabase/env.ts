/**
 * Read a required environment variable. Throws if missing.
 * Shared across all Supabase client modules.
 */
export function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}
