import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SupabaseClientType = SupabaseClient<Database>;

export interface GiftOption {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SaleAddon {
  id: string;
  sale_id: string;
  organization_id: string;
  addon_type: string;
  gift_option_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  gift_message: string | null;
  created_at: string | null;
}

export interface AddGiftToSaleParams {
  supabase: SupabaseClientType;
  organizationId: string;
  saleId: string;
  giftOptionId: string;
  giftMessage?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Resolve gift option (server-side price)                            */
/* ------------------------------------------------------------------ */

/**
 * Fetch a gift option by ID, validating it belongs to the organization
 * and is active. The price is always read from the database — never
 * trusted from client input.
 */
export async function resolveGiftOption(
  supabase: SupabaseClientType,
  organizationId: string,
  giftOptionId: string,
): Promise<{ giftOption: GiftOption | null; error?: string }> {
  const { data, error } = await withDbCapture(
    "gift-addons:resolve_option",
    supabase
      .from("gift_options")
      .select("*")
      .eq("id", giftOptionId)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single(),
  );

  if (error || !data) {
    capture(error ?? new Error("Gift option not found"), {
      context: "resolveGiftOption",
    });
    return {
      giftOption: null,
      error: "Бэлэг сонголт олдсонгүй эсвэл идэвхгүй байна.",
    };
  }

  return { giftOption: data as GiftOption };
}

/* ------------------------------------------------------------------ */
/*  Add gift to sale                                                   */
/* ------------------------------------------------------------------ */

/**
 * Insert a sale_addon record for a gift option. Resolves the gift
 * option price server-side and stores name/price snapshots so the
 * addon is audit-safe even if the gift option is later edited.
 *
 * The gift message is capped at 500 characters.
 */
export async function addGiftToSale(
  params: AddGiftToSaleParams,
): Promise<{ addon: SaleAddon | null; error?: string }> {
  const { supabase, organizationId, saleId, giftOptionId, giftMessage } =
    params;

  // 1. Resolve gift option server-side (never trust client price)
  const { giftOption, error: resolveError } = await resolveGiftOption(
    supabase,
    organizationId,
    giftOptionId,
  );

  if (resolveError || !giftOption) {
    return { addon: null, error: resolveError ?? "Бэлэг сонголт олдсонгүй." };
  }

  // 2. Validate gift message length
  const trimmedMessage = giftMessage?.trim() || null;
  if (trimmedMessage && trimmedMessage.length > 500) {
    return {
      addon: null,
      error: "Бэлэгний мессеж 500 тэмдэгтээс хэтэрсэн байна.",
    };
  }

  // 3. Insert addon with server-resolved snapshots
  const { data, error } = await withDbCapture(
    "gift-addons:add_to_sale",
    supabase
      .from("sale_addons")
      .insert({
        sale_id: saleId,
        organization_id: organizationId,
        addon_type: "gift_option",
        gift_option_id: giftOption.id,
        name_snapshot: giftOption.name,
        price_snapshot: giftOption.price,
        gift_message: trimmedMessage,
      })
      .select("*")
      .single(),
  );

  if (error) {
    capture(error, { context: "addGiftToSale" });
    return {
      addon: null,
      error: `Бэлэг нэмэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  return { addon: data as SaleAddon };
}

/* ------------------------------------------------------------------ */
/*  Fetch sale addons                                                  */
/* ------------------------------------------------------------------ */

/**
 * Fetch all addons (gift packaging) attached to a sale.
 */
export async function getSaleAddons(
  supabase: SupabaseClientType,
  saleId: string,
): Promise<{ addons: SaleAddon[]; error?: string }> {
  const { data, error } = await withDbCapture(
    "gift-addons:get_sale_addons",
    supabase
      .from("sale_addons")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at"),
  );

  if (error) {
    capture(error, { context: "getSaleAddons" });
    return {
      addons: [],
      error: "Борлуулалтын нэмэлтүүдийг авахад алдаа гарлаа.",
    };
  }

  return { addons: (data ?? []) as SaleAddon[] };
}
