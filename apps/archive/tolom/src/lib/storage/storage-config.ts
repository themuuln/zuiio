/**
 * Storage backend configuration.
 *
 * Set STORAGE_BACKEND env var to switch between backends:
 *   - "supabase" (default) — Supabase Storage with permanent public URLs
 *   - "r2" — Cloudflare R2 with presigned URLs (expire in 1 hour)
 *
 * R2 requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 * Supabase requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (already configured)
 */

export type StorageBackend = "supabase" | "r2";

export function getStorageBackend(): StorageBackend {
  const backend = process.env.STORAGE_BACKEND ?? "supabase";
  if (backend !== "supabase" && backend !== "r2") {
    throw new Error(
      `Invalid STORAGE_BACKEND "${backend}". Must be "supabase" or "r2".`,
    );
  }
  return backend;
}
