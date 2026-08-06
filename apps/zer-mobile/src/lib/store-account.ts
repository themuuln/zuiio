import type { TableClient } from "@/lib/client";

/**
 * Buyer store-account helpers. Mirrors the web storefront's
 * use-store-session logic (apps/zer/src/app/[slug]/account/):
 * a buyer's row in `store_accounts` is keyed on auth.users.id, is
 * created/upserted on first login, and RLS only allows the owner
 * to read/write it.
 */

export interface StoreAccountRow {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
}

export interface SessionUserLike {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 12;
}

/** Resolve display_name/phone from sign-up metadata (mirrors the web). */
export function accountMetadata(user: Partial<SessionUserLike>): {
  displayName: string | null;
  phone: string | null;
} {
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" ? metadata.display_name : null;
  const phone = typeof metadata.phone === "string" ? metadata.phone : null;
  return { displayName, phone };
}

/**
 * Ensure the signed-in user has a store_accounts row, upserting it from
 * the session when missing. Returns the row + whether it was created.
 */
export async function ensureStoreAccount(
  client: TableClient,
  user: SessionUserLike,
): Promise<{ account: StoreAccountRow; created: boolean }> {
  const { data: existing } = await client
    .from("store_accounts")
    .select("id, email, display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (existing && typeof existing === "object") {
    return {
      account: existing as unknown as StoreAccountRow,
      created: false,
    };
  }

  const { displayName, phone } = accountMetadata(user);
  const row: StoreAccountRow = {
    id: user.id,
    email: user.email ?? "",
    display_name: displayName,
    phone,
  };
  const { error } = await client.from("store_accounts").upsert({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    phone: row.phone,
  });
  if (error) {
    throw new Error(`store_accounts upsert failed: ${error.message}`);
  }
  return { account: row, created: true };
}
