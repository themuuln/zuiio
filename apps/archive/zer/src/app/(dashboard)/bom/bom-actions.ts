"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

function extractName(value: unknown): string {
  if (value && typeof value === "object" && "name" in value) {
    const v = value as Record<"name", unknown>;
    return typeof v.name === "string" ? v.name : "";
  }
  return "";
}

// ─── Shared types ──────────────────────────────────────────────────────────

export interface BomListItem {
  id: string;
  name: string;
  version: number;
  status: string;
  product_id: string;
  product_name: string;
  item_count: number;
  activated_at: string | null;
  created_at: string;
}

export interface BomItemData {
  material_product_id: string;
  quantity: number;
  unit: string;
  required_width_mm?: number | null;
  required_length_mm?: number | null;
  required_thickness_mm?: number | null;
  estimated_unit_cost?: number;
  sort_order?: number;
  notes?: string;
}

export interface BomDetail {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  version: number;
  status: string;
  notes: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    material_product_id: string;
    material_product_name: string;
    quantity: number;
    unit: string;
    required_width_mm: number | null;
    required_length_mm: number | null;
    required_thickness_mm: number | null;
    estimated_unit_cost: number | null;
    sort_order: number;
    notes: string | null;
  }>;
}

// ─── List BOMs ─────────────────────────────────────────────────────────────

export async function listBoms() {
  const ctx = await requireWriteAction("boms.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "bom: listBoms",
    supabase
      .from("product_boms")
      .select(
        `
        id,
        name,
        version,
        status,
        product_id,
        activated_at,
        created_at,
        product:products!inner(name)
      `,
        { count: "exact" },
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );

  if (error) {
    capture(error, { context: "bom: listBoms" });
    return { error: "BOM жагсаалт авахад алдаа гарлаа." };
  }

  // Get item counts for each BOM
  const bomIds = data.map((b) => b.id);
  const { data: counts } = await supabase
    .from("bom_items")
    .select("bom_id, id")
    .in("bom_id", bomIds)
    .is("deleted_at", null);

  const countMap: Record<string, number> = {};
  if (counts) {
    for (const c of counts) {
      countMap[c.bom_id] = (countMap[c.bom_id] ?? 0) + 1;
    }
  }

  const items: BomListItem[] = data.map((b) => ({
    id: b.id,
    name: b.name,
    version: b.version,
    status: b.status,
    product_id: b.product_id,
    product_name: extractName(b.product),
    item_count: countMap[b.id] ?? 0,
    activated_at: b.activated_at,
    created_at: b.created_at,
  }));

  return { success: true as const, data: items, error: undefined };
}

// ─── Get single BOM with items ─────────────────────────────────────────────

export async function getBom(bomId: string) {
  const ctx = await requireWriteAction("boms.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: bom, error: bomError } = await withDbCapture(
    "bom: getBom",
    supabase
      .from("product_boms")
      .select(
        `
        id,
        organization_id,
        product_id,
        name,
        version,
        status,
        notes,
        activated_at,
        created_at,
        updated_at,
        product:products!inner(name)
      `,
      )
      .eq("id", bomId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single(),
  );

  if (bomError) {
    capture(bomError, { context: "bom: getBom" });
    return { error: "BOM олдсонгүй." };
  }

  const { data: items, error: itemsError } = await withDbCapture(
    "bom: getBom items",
    supabase
      .from("bom_items")
      .select(
        `
        id,
        material_product_id,
        quantity,
        unit,
        required_width_mm,
        required_length_mm,
        required_thickness_mm,
        estimated_unit_cost,
        sort_order,
        notes,
        material_product:products!inner(name)
      `,
      )
      .eq("bom_id", bomId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  );

  if (itemsError) {
    capture(itemsError, { context: "bom: getBom items" });
    return { error: "BOM материалын жагсаалт авахад алдаа гарлаа." };
  }

  const detail: BomDetail = {
    id: bom.id,
    organization_id: bom.organization_id,
    product_id: bom.product_id,
    name: bom.name,
    version: bom.version,
    status: bom.status,
    notes: bom.notes,
    activated_at: bom.activated_at,
    created_at: bom.created_at,
    updated_at: bom.updated_at,
    items: (items ?? []).map((i) => ({
      id: i.id,
      material_product_id: i.material_product_id,
      material_product_name: extractName(i.material_product),
      quantity: i.quantity,
      unit: i.unit,
      required_width_mm: i.required_width_mm,
      required_length_mm: i.required_length_mm,
      required_thickness_mm: i.required_thickness_mm,
      estimated_unit_cost: i.estimated_unit_cost,
      sort_order: i.sort_order,
      notes: i.notes,
    })),
  };

  return { success: true as const, data: detail, error: undefined };
}

// ─── Create draft BOM with items ───────────────────────────────────────────

interface CreateBomInput {
  product_id: string;
  name: string;
  items: BomItemData[];
}

export async function createBom(input: CreateBomInput) {
  const ctx = await requireWriteAction("boms.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  if (!input.product_id) {
    return { error: "Бүтээгдэхүүн сонгоно уу." };
  }

  if (!input.name?.trim()) {
    return { error: "BOM нэр шаардлагатай." };
  }

  if (!input.items || input.items.length === 0) {
    return { error: "BOM-д дор хаяж нэг материал шаардлагатай." };
  }

  // Validate all items have valid data
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.material_product_id) {
      return { error: `#${i + 1} материал сонгоогүй байна.` };
    }
    if (!item.unit?.trim()) {
      return { error: `#${i + 1} материалын хэмжих нэгж шаардлагатай.` };
    }
  }

  // Get the next version for this product
  const { data: latestBom } = await supabase
    .from("product_boms")
    .select("version")
    .eq("organization_id", organizationId)
    .eq("product_id", input.product_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestBom?.version ?? 0) + 1;

  // Verify the product exists and belongs to this org
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", input.product_id)
    .eq("organization_id", organizationId)
    .single();

  if (!product) {
    return { error: "Бүтээгдэхүүн олдсонгүй." };
  }

  // Insert BOM
  const { data: bom, error: insertError } = await withDbCapture(
    "bom: createBom",
    supabase
      .from("product_boms")
      .insert({
        organization_id: organizationId,
        product_id: input.product_id,
        name: input.name.trim(),
        version: nextVersion,
        status: "draft",
      })
      .select("id")
      .single(),
  );

  if (insertError || !bom) {
    capture(insertError, { context: "bom: createBom" });
    return { error: "BOM үүсгэхэд алдаа гарлаа." };
  }

  // Insert items
  const itemsToInsert = input.items.map((item, i) => ({
    organization_id: organizationId,
    bom_id: bom.id,
    material_product_id: item.material_product_id,
    quantity: item.quantity,
    unit: item.unit.trim(),
    required_width_mm: item.required_width_mm ?? null,
    required_length_mm: item.required_length_mm ?? null,
    required_thickness_mm: item.required_thickness_mm ?? null,
    estimated_unit_cost: item.estimated_unit_cost ?? 0,
    sort_order: item.sort_order ?? i,
    notes: item.notes ?? null,
  }));

  const { error: itemsError } = await withDbCapture(
    "bom: createBom items",
    supabase.from("bom_items").insert(itemsToInsert),
  );

  if (itemsError) {
    capture(itemsError, { context: "bom: createBom items" });
    // Attempt cleanup: delete the BOM we just created
    await supabase.from("product_boms").delete().eq("id", bom.id);
    return { error: "BOM материал хадгалахад алдаа гарлаа." };
  }

  revalidateEntities(["products"]);
  return { success: true as const, data: { id: bom.id }, error: undefined };
}

// ─── Update draft BOM ──────────────────────────────────────────────────────

interface UpdateBomInput {
  bom_id: string;
  name?: string;
  notes?: string | null;
  items?: BomItemData[];
}

export async function updateBom(input: UpdateBomInput) {
  const ctx = await requireWriteAction("boms.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Only draft BOMs can be updated
  const { data: existing, error: fetchError } = await withDbCapture(
    "bom: updateBom check",
    supabase
      .from("product_boms")
      .select("id, status")
      .eq("id", input.bom_id)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single(),
  );

  if (fetchError || !existing) {
    return { error: "BOM олдсонгүй." };
  }

  if (existing.status !== "draft") {
    return { error: "Зөвхөн ноорог төлөвтэй BOM засах боломжтой." };
  }

  // Update BOM metadata
  const updateData = {
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await withDbCapture(
      "bom: updateBom",
      supabase.from("product_boms").update(updateData).eq("id", input.bom_id),
    );

    if (updateError) {
      capture(updateError, { context: "bom: updateBom" });
      return { error: "BOM засахад алдаа гарлаа." };
    }
  }

  // If items provided, replace all items
  if (input.items) {
    // Soft-delete existing items
    const { error: deleteError } = await withDbCapture(
      "bom: updateBom delete old items",
      supabase
        .from("bom_items")
        .update({ deleted_at: new Date().toISOString() })
        .eq("bom_id", input.bom_id)
        .is("deleted_at", null),
    );

    if (deleteError) {
      capture(deleteError, { context: "bom: updateBom delete items" });
      return { error: "Хуучин материалыг устгахад алдаа гарлаа." };
    }

    // Insert new items
    const itemsToInsert = input.items.map((item, i) => ({
      organization_id: organizationId,
      bom_id: input.bom_id,
      material_product_id: item.material_product_id,
      quantity: item.quantity,
      unit: item.unit.trim(),
      required_width_mm: item.required_width_mm ?? null,
      required_length_mm: item.required_length_mm ?? null,
      required_thickness_mm: item.required_thickness_mm ?? null,
      estimated_unit_cost: item.estimated_unit_cost ?? 0,
      sort_order: item.sort_order ?? i,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await withDbCapture(
      "bom: updateBom insert items",
      supabase.from("bom_items").insert(itemsToInsert),
    );

    if (itemsError) {
      capture(itemsError, { context: "bom: updateBom items" });
      return { error: "BOM материал хадгалахад алдаа гарлаа." };
    }
  }

  revalidateEntities(["products"]);
  return { success: true as const, error: undefined };
}

// ─── Soft-delete draft BOM ─────────────────────────────────────────────────

export async function deleteBom(bomId: string) {
  const ctx = await requireWriteAction("boms.delete");
  if ("error" in ctx) return ctx;
  const { supabase } = ctx;

  // Only draft BOMs can be deleted
  const { data: existing, error: fetchError } = await supabase
    .from("product_boms")
    .select("id, status")
    .eq("id", bomId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    return { error: "BOM олдсонгүй." };
  }

  if (existing.status !== "draft") {
    return { error: "Зөвхөн ноорог төлөвтэй BOM устгах боломжтой." };
  }

  // Soft-delete the BOM
  const { error: deleteError } = await withDbCapture(
    "bom: deleteBom",
    supabase
      .from("product_boms")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", bomId),
  );

  if (deleteError) {
    capture(deleteError, { context: "bom: deleteBom" });
    return { error: "BOM устгахад алдаа гарлаа." };
  }

  revalidateEntities(["products"]);
  return { success: true as const, error: undefined };
}

// ─── Activate BOM (transactional via RPC) ──────────────────────────────────

export async function activateBom(bomId: string) {
  const ctx = await requireWriteAction("boms.update");
  if ("error" in ctx) return ctx;
  const { supabase } = ctx;

  const { error: rpcError } = await withDbCapture(
    "bom: activateBom",
    supabase.rpc("activate_bom", { p_bom_id: bomId }),
  );

  if (rpcError) {
    capture(rpcError, { context: "bom: activateBom" });
    // Check for known error messages from the RPC function
    if (rpcError.message?.includes("Draft BOM")) {
      return {
        error:
          "Идэвхжүүлэх BOM олдсонгүй. BOM ноорог төлөвтэй эсэхийг шалгана уу.",
      };
    }
    return { error: `BOM идэвхжүүлэхэд алдаа гарлаа: ${rpcError.message}` };
  }

  revalidateEntities(["products"]);
  return { success: true as const, error: undefined };
}
