"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CustomerSegmentRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function listCustomerSegments(): Promise<{
  segments: CustomerSegmentRow[];
  error?: string;
}> {
  const ctx = await requireActionContext("contacts.read");
  if ("error" in ctx) return { segments: [], error: ctx.error };
  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("customer_segments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order")
    .order("name");

  if (error) {
    capture(error, { context: "listCustomerSegments" });
    return {
      segments: [],
      error: "Харилцагчийн сегментийн жагсаалт авахад алдаа гарлаа.",
    };
  }

  return { segments: (data ?? []) as CustomerSegmentRow[] };
}

/* ------------------------------------------------------------------ */
/*  Create / Update / Delete                                           */
/* ------------------------------------------------------------------ */

export async function createCustomerSegment(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("contacts.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") !== "false"; // default true

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  // Slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яёөү\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const { error } = await withDbCapture(
    "customer_segments: create",
    supabase.from("customer_segments").insert({
      organization_id: organizationId,
      name,
      slug,
      sort_order: sortOrder,
      is_active: isActive,
    }),
  );

  if (error) {
    capture(error, { context: "createCustomerSegment" });
    if (error.code === "23505") {
      return { error: `"${name}" нэртэй сегмент аль хэдийн байна.` };
    }
    return { error: `Сегмент үүсгэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("customers");
  return { success: true as const };
}

export async function updateCustomerSegment(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("contacts.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") !== "false";

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яёөү\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const { error } = await withDbCapture(
    "customer_segments: update",
    supabase
      .from("customer_segments")
      .update({
        name,
        slug,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "updateCustomerSegment" });
    return { error: `Сегмент шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("customers");
  return { success: true as const };
}

export async function deleteCustomerSegment(id: string) {
  const ctx = await requireActionContext("contacts.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await withDbCapture(
    "customer_segments: delete",
    supabase
      .from("customer_segments")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteCustomerSegment" });
    return { error: `Сегмент устгахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("customers");
  return { success: true as const };
}

/* ------------------------------------------------------------------ */
/*  Preset seed                                                        */
/* ------------------------------------------------------------------ */

/**
 * Creates the default customer segment presets for the current
 * organization. Idempotent — skips segments that already exist.
 */
export async function seedCustomerSegmentPreset() {
  const ctx = await requireActionContext("contacts.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const presets = [
    { name: "Хувь хүн", slug: "huuv-hun", sort_order: 0 },
    { name: "Сүсэгтэн", slug: "suusegten", sort_order: 1 },
    { name: "Лам", slug: "lam", sort_order: 2 },
    { name: "Хийд/Сүм", slug: "hiid-sum", sort_order: 3 },
  ];

  let created = 0;
  for (const preset of presets) {
    const { error } = await withDbCapture(
      "customer_segments: seed preset upsert",
      supabase.from("customer_segments").upsert(
        {
          organization_id: organizationId,
          name: preset.name,
          slug: preset.slug,
          sort_order: preset.sort_order,
          is_active: true,
        },
        { onConflict: "organization_id,slug", ignoreDuplicates: true },
      ),
    );
    if (error) {
      capture(error, { context: "seedCustomerSegmentPreset: upsert" });
    } else {
      created++;
    }
  }

  revalidateEntity("customers");
  return { success: true as const, created };
}
