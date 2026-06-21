"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

interface AdjustmentItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number | null;
}

export async function createBatchAdjustment(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("stock_movements.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const notes = formData.get("notes") as string | null;
  const itemsJson = formData.get("items") as string | null;

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  let items: AdjustmentItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  const batchId = crypto.randomUUID();
  const reference = `batch:${batchId}`;
  const defaultNotes = notes || "Бөөнөөр тохируулга";

  // Update product/variant current_stock and create movements in sequence
  for (const item of items) {
    if (item.quantity === 0) continue;

    // Update stock
    if (item.variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("current_stock")
        .eq("id", item.variant_id)
        .single();

      if (variant) {
        const newStock = Math.max(
          0,
          (variant.current_stock ?? 0) + item.quantity,
        );
        await supabase
          .from("product_variants")
          .update({ current_stock: newStock })
          .eq("id", item.variant_id);
      }
    }

    const { data: product } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", item.product_id)
      .single();

    if (product) {
      const newStock = Math.max(
        0,
        (product.current_stock ?? 0) + item.quantity,
      );
      await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", item.product_id);
    }

    // Create stock movement
    const { error: mvError } = await supabase.from("stock_movements").insert({
      organization_id: organizationId,
      branch_id: branchId!,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      type: "adjustment",
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      notes: defaultNotes,
      reference,
      created_by: userId,
    });

    if (mvError) {
      return {
        error: `Тохируулга хадгалахад алдаа гарлаа: ${mvError.message}`,
      };
    }
  }

  revalidateEntities(["inventory"]);
  return { success: true, error: undefined, batchId };
}
