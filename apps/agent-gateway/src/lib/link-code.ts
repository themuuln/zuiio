import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

export async function createLinkCode(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  productType: string,
): Promise<{ code: string; formatted: string } | null> {
  const bytes = randomBytes(8);
  const chars: string[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    chars.push(CHARS[bytes[i]! % CHARS.length]!);
  }
  const code = chars.join("");

  const { error } = await supabase.from("one_time_tokens").insert({
    token_hash: code,
    organization_id: orgId,
    user_id: userId,
    product_type: productType,
    expires_at: new Date(Date.now() + CODE_EXPIRY_MS).toISOString(),
  });

  if (error) {
    console.error("createLinkCode error:", error.message);
    return null;
  }

  return { code, formatted: `${code.slice(0, 4)}-${code.slice(4, 8)}` };
}

export async function redeemLinkCode(
  supabase: SupabaseClient,
  rawInput: string,
): Promise<{ orgId: string; userId: string; productType: string } | null> {
  const code = rawInput.replace(/[\s-]/g, "").toUpperCase();
  if (code.length !== CODE_LENGTH) return null;

  const { data, error } = await supabase
    .from("one_time_tokens")
    .select("*")
    .eq("token_hash", code)
    .is("used_at", null)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("one_time_tokens").delete().eq("id", data.id);
    return null;
  }

  await supabase.from("one_time_tokens").update({ used_at: new Date().toISOString() }).eq("id", data.id);

  return {
    orgId: data.organization_id,
    userId: data.user_id,
    productType: data.product_type,
  };
}
