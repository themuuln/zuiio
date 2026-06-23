"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function updateWarehouse(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("warehouses.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const location = getString(formData, "location");

  if (!id) return { error: "Агуулахын ID олдсонгүй." };
  if (!name) return { error: "Нэр шаардлагатай." };

  const { error } = await supabase
    .from("warehouses")
    .update({
      name,
      location: location || null,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `Агуулах шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["inventory"]);
  return { success: true as const, error: undefined };
}
