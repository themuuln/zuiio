"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GiftOptionRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function listGiftOptions(): Promise<{
  giftOptions: GiftOptionRow[];
  error?: string;
}> {
  const ctx = await requireActionContext("products.read");
  if ("error" in ctx) return { giftOptions: [], error: ctx.error };
  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("gift_options")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    capture(error, { context: "listGiftOptions" });
    return {
      giftOptions: [],
      error: "Бэлэг сонголтын жагсаалт авахад алдаа гарлаа.",
    };
  }

  return { giftOptions: (data ?? []) as GiftOptionRow[] };
}

/* ------------------------------------------------------------------ */
/*  Create / Update / Delete                                           */
/* ------------------------------------------------------------------ */

export async function createGiftOption(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceStr = formData.get("price")?.toString();
  const price = priceStr ? Number.parseFloat(priceStr) : 0;

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Үнэ буруу байна." };
  }

  const { error } = await supabase.from("gift_options").insert({
    organization_id: organizationId,
    name,
    description,
    price,
  });

  if (error) {
    capture(error, { context: "createGiftOption" });
    if (error.code === "23505") {
      return {
        error: `"${name}" нэртэй бэлэг сонголт аль хэдийн байна.`,
      };
    }
    return {
      error: `Бэлэг сонголт үүсгэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true as const };
}

export async function updateGiftOption(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceStr = formData.get("price")?.toString();
  const price = priceStr ? Number.parseFloat(priceStr) : 0;

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Үнэ буруу байна." };
  }

  const { error } = await supabase
    .from("gift_options")
    .update({ name, description, price })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "updateGiftOption" });
    return {
      error: `Бэлэг сонголт шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true as const };
}

export async function deleteGiftOption(id: string) {
  const ctx = await requireActionContext("products.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("gift_options")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "deleteGiftOption" });
    return {
      error: `Бэлэг сонголт устгахад алдаа гарлаа: ${error.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true as const };
}
