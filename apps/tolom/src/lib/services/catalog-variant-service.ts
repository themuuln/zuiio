import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CatalogItemVariant,
  CatalogVariantGroup,
  CatalogVariantOption,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════
// VARIANT GROUPS (Dimensions e.g. "Size", "Grade", "Package")
// ═══════════════════════════════════════════════════════════════

export async function getVariantGroups(
  db: SupabaseClient,
  orgId: string,
  appliesTo?: "service" | "part" | "both",
): Promise<CatalogVariantGroup[]> {
  const supabase = db;
  let query = supabase
    .from("catalog_variant_groups")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("name");

  if (appliesTo) {
    query = query.eq("applies_to", appliesTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to fetch variant groups");
  return (data ?? []) as unknown as CatalogVariantGroup[];
}

export async function getVariantGroup(
  db: SupabaseClient,
  id: string,
): Promise<CatalogVariantGroup> {
  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_variant_groups")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Variant group not found");
  return data as unknown as CatalogVariantGroup;
}

export async function createVariantGroup(
  db: SupabaseClient,
  orgId: string,
  params: {
    name: string;
    name_mn?: string | null;
    applies_to: "service" | "part" | "both";
    sort_order?: number;
  },
): Promise<CatalogVariantGroup> {
  if (!params.name?.trim()) throw new ValidationError("Name is required");

  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_variant_groups")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      name_mn: params.name_mn?.trim() ?? null,
      applies_to: params.applies_to,
      sort_order: params.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create variant group");

  revalidateTag(cacheTags.variantGroups(orgId), "max");
  return data as unknown as CatalogVariantGroup;
}

export async function updateVariantGroup(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: {
    name?: string;
    name_mn?: string | null;
    applies_to?: "service" | "part" | "both";
    sort_order?: number;
  },
): Promise<CatalogVariantGroup> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("catalog_variant_groups")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) throw new NotFoundError("Variant group not found");

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.name_mn !== undefined)
    updates.name_mn = params.name_mn?.trim() ?? null;
  if (params.applies_to !== undefined) updates.applies_to = params.applies_to;
  if (params.sort_order !== undefined) updates.sort_order = params.sort_order;

  const { data, error } = await supabase
    .from("catalog_variant_groups")
    // biome-ignore lint/suspicious/noExplicitAny: dynamic update
    .update(updates as any)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Variant group not found");

  revalidateTag(cacheTags.variantGroups(orgId), "max");
  return data as unknown as CatalogVariantGroup;
}

export async function deleteVariantGroup(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("catalog_variant_groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new NotFoundError("Variant group not found");

  revalidateTag(cacheTags.variantGroups(orgId), "max");
}

// ═══════════════════════════════════════════════════════════════
// VARIANT OPTIONS (Values within each dimension)
// ═══════════════════════════════════════════════════════════════

export async function getVariantOptions(
  db: SupabaseClient,
  orgId: string,
  groupId?: string,
): Promise<CatalogVariantOption[]> {
  const supabase = db;
  let query = supabase
    .from("catalog_variant_options")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("label");

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data, error } = await query;
  if (error)
    throw new Error(error.message ?? "Failed to fetch variant options");
  return (data ?? []) as unknown as CatalogVariantOption[];
}

export async function getVariantOption(
  db: SupabaseClient,
  id: string,
): Promise<CatalogVariantOption> {
  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_variant_options")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Variant option not found");
  return data as unknown as CatalogVariantOption;
}

export async function createVariantOption(
  db: SupabaseClient,
  orgId: string,
  params: {
    group_id: string;
    label: string;
    label_mn?: string | null;
    sort_order?: number;
  },
): Promise<CatalogVariantOption> {
  if (!params.label?.trim()) throw new ValidationError("Label is required");
  if (!params.group_id) throw new ValidationError("Group ID is required");

  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_variant_options")
    .insert({
      organization_id: orgId,
      group_id: params.group_id,
      label: params.label.trim(),
      label_mn: params.label_mn?.trim() ?? null,
      sort_order: params.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create variant option");

  revalidateTag(cacheTags.variantOptions(orgId), "max");
  return data as unknown as CatalogVariantOption;
}

export async function updateVariantOption(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: {
    label?: string;
    label_mn?: string | null;
    sort_order?: number;
  },
): Promise<CatalogVariantOption> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("catalog_variant_options")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) throw new NotFoundError("Variant option not found");

  const updates: Record<string, unknown> = {};
  if (params.label !== undefined) updates.label = params.label.trim();
  if (params.label_mn !== undefined)
    updates.label_mn = params.label_mn?.trim() ?? null;
  if (params.sort_order !== undefined) updates.sort_order = params.sort_order;

  const { data, error } = await supabase
    .from("catalog_variant_options")
    // biome-ignore lint/suspicious/noExplicitAny: dynamic update
    .update(updates as any)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Variant option not found");

  revalidateTag(cacheTags.variantOptions(orgId), "max");
  return data as unknown as CatalogVariantOption;
}

export async function deleteVariantOption(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("catalog_variant_options")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new NotFoundError("Variant option not found");

  revalidateTag(cacheTags.variantOptions(orgId), "max");
}

// ═══════════════════════════════════════════════════════════════
// ITEM VARIANTS (Concrete priced variants for a service or part)
// ═══════════════════════════════════════════════════════════════

export interface CreateItemVariantParams {
  entity_type: "service" | "part";
  entity_id: string;
  variant_label: string;
  variant_data: Record<string, string>;
  price?: number | null;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  sort_order?: number;
}

export interface UpdateItemVariantParams {
  variant_label?: string;
  variant_data?: Record<string, string>;
  price?: number | null;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ItemVariantWithGroupInfo extends CatalogItemVariant {
  group_labels?: Record<string, string>;
  group_labels_mn?: Record<string, string>;
}

/**
 * Get all variants for a service or part.
 */
export async function getItemVariants(
  db: SupabaseClient,
  orgId: string,
  entityType: "service" | "part",
  entityId: string,
): Promise<ItemVariantWithGroupInfo[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_item_variants")
    .select("*")
    .eq("organization_id", orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("variant_label");

  if (error) throw new Error(error.message ?? "Failed to fetch item variants");
  return (data ?? []) as unknown as ItemVariantWithGroupInfo[];
}

/**
 * Get a single item variant by id.
 */
export async function getItemVariant(
  db: SupabaseClient,
  id: string,
): Promise<CatalogItemVariant> {
  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_item_variants")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Item variant not found");
  return data as unknown as CatalogItemVariant;
}

/**
 * Create a variant for a service or part.
 * The variant_label is typically auto-generated from selected options.
 */
export async function createItemVariant(
  db: SupabaseClient,
  orgId: string,
  params: CreateItemVariantParams,
  userId?: string | null,
): Promise<CatalogItemVariant> {
  if (!params.variant_label?.trim())
    throw new ValidationError("Variant label is required");

  const supabase = db;
  const { data, error } = await supabase
    .from("catalog_item_variants")
    .insert({
      organization_id: orgId,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      variant_label: params.variant_label.trim(),
      variant_data: params.variant_data as unknown as Record<string, unknown>,
      price: params.price ?? null,
      cost: params.cost ?? null,
      sku: params.sku?.trim() ?? null,
      barcode: params.barcode?.trim() ?? null,
      sort_order: params.sort_order ?? 0,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    })
    .select("*")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create item variant");

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "catalog_item_variants",
    record_id: data.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(
    cacheTags.itemVariants(orgId, params.entity_type, params.entity_id),
    "max",
  );
  return data as unknown as CatalogItemVariant;
}

/**
 * Update a variant for a service or part.
 */
export async function updateItemVariant(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateItemVariantParams,
  userId?: string | null,
): Promise<CatalogItemVariant> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("catalog_item_variants")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) throw new NotFoundError("Item variant not found");

  const updates: Record<string, unknown> = { updated_by: userId ?? null };
  if (params.variant_label !== undefined)
    updates.variant_label = params.variant_label.trim();
  if (params.variant_data !== undefined)
    updates.variant_data = params.variant_data;
  if (params.price !== undefined) updates.price = params.price;
  if (params.cost !== undefined) updates.cost = params.cost;
  if (params.sku !== undefined) updates.sku = params.sku?.trim() ?? null;
  if (params.barcode !== undefined)
    updates.barcode = params.barcode?.trim() ?? null;
  if (params.is_active !== undefined) updates.is_active = params.is_active;
  if (params.sort_order !== undefined) updates.sort_order = params.sort_order;

  const { data, error } = await supabase
    .from("catalog_item_variants")
    // biome-ignore lint/suspicious/noExplicitAny: dynamic update
    .update(updates as any)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Item variant not found");

  const entityType = existing.entity_type as string;
  const entityId = existing.entity_id as string;

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "catalog_item_variants",
    record_id: id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    old_data: existing as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.itemVariants(orgId, entityType, entityId), "max");
  return data as unknown as CatalogItemVariant;
}

/**
 * Soft-delete a variant for a service or part.
 */
export async function deleteItemVariant(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId?: string | null,
): Promise<void> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("catalog_item_variants")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) throw new NotFoundError("Item variant not found");

  const { error } = await supabase
    .from("catalog_item_variants")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId ?? null,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new NotFoundError("Item variant not found");

  const entityType = existing.entity_type as string;
  const entityId = existing.entity_id as string;

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "catalog_item_variants",
    record_id: id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    old_data: existing as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.itemVariants(orgId, entityType, entityId), "max");
}

/**
 * Bulk-create variants for a service or part from dimension options.
 * Generates all combinations (Cartesian product) of the selected option IDs,
 * then creates/updates variants with their prices.
 */
export async function bulkGenerateVariants(
  db: SupabaseClient,
  orgId: string,
  entityType: "service" | "part",
  entityId: string,
  /**
   * Map of group_name -> option labels to combine.
   * E.g. { "Size": ["Small", "Medium"], "Add-on": ["Basic", "Wax"] }
   * generates: "Small + Basic", "Small + Wax", "Medium + Basic", "Medium + Wax"
   */
  dimensionOptions: Record<string, string[]>,
  /**
   * Optional pricing callback: receives the combination map and returns a price.
   * When null, the entity's default_price is used for all variants.
   */
  getPrice?: (combination: Record<string, string>) => number | null | undefined,
  userId?: string | null,
): Promise<CatalogItemVariant[]> {
  const supabase = db;

  // Generate cartesian product of all dimension options
  const groupNames = Object.keys(dimensionOptions);
  const combinations = cartesianProduct(
    groupNames.map((name) =>
      dimensionOptions[name].map((label) => ({ group: name, option: label })),
    ),
  );

  const results: CatalogItemVariant[] = [];

  for (const combo of combinations) {
    const variantData: Record<string, string> = {};
    for (const item of combo) {
      variantData[item.group] = item.option;
    }

    const variantLabel = combo.map((c) => c.option).join(" + ");
    const price = getPrice ? getPrice(variantData) : null;

    // Upsert: if variant with same label exists, update it; otherwise create
    const { data: existing } = await supabase
      .from("catalog_item_variants")
      .select("id")
      .eq("organization_id", orgId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("variant_label", variantLabel)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("catalog_item_variants")
        .update({
          variant_data: variantData,
          price,
          updated_by: userId ?? null,
        } satisfies Record<string, unknown>)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (!error && data) {
        results.push(data as unknown as CatalogItemVariant);
      }
    } else {
      const { data, error } = await supabase
        .from("catalog_item_variants")
        .insert({
          organization_id: orgId,
          entity_type: entityType,
          entity_id: entityId,
          variant_label: variantLabel,
          variant_data: variantData,
          price,
          created_by: userId ?? null,
          updated_by: userId ?? null,
        })
        .select("*")
        .single();

      if (!error && data) {
        results.push(data as unknown as CatalogItemVariant);
      }
    }
  }

  revalidateTag(cacheTags.itemVariants(orgId, entityType, entityId), "max");
  return results;
}

/**
 * Resolve the price for a given variant of a service or part.
 * Returns the variant price (or null if no variant matches).
 */
export async function resolveVariantPrice(
  db: SupabaseClient,
  orgId: string,
  entityType: "service" | "part",
  entityId: string,
  variantData: Record<string, string>,
): Promise<CatalogItemVariant | null> {
  const supabase = db;

  // Build a query that matches all entries in variant_data
  // We store variant_data as JSONB, so we can query it
  const { data, error } = await supabase
    .from("catalog_item_variants")
    .select("*")
    .eq("organization_id", orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .eq("is_active", true);

  if (error || !data) return null;

  // Find exact match by comparing variant_data
  const match = (data as unknown as CatalogItemVariant[]).find((v) => {
    const vd = v.variant_data as unknown as Record<string, unknown>;
    if (Object.keys(vd).length !== Object.keys(variantData).length)
      return false;
    for (const [key, value] of Object.entries(variantData)) {
      if (vd[key] !== value) return false;
    }
    return true;
  });

  return match ?? null;
}

// ── Utility ──────────────────────────────────────────────────

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]));
}
