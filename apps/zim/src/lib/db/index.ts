import "server-only";
import { MemoryDb } from "./memory";
import { SupabaseDb } from "./supabase";
import type { Db } from "./types";

export type { Db, OrderCreateInput, OrderDetail } from "./types";

let cached: Db | null = null;

/**
 * Backend switch (zill db.ts pattern): Supabase when
 * SUPABASE_SERVICE_ROLE_KEY is configured, in-memory otherwise —
 * so the full flow works locally with zero credentials.
 */
export function getDb(): Db {
  if (cached) return cached;
  cached =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new SupabaseDb()
      : new MemoryDb();
  return cached;
}
