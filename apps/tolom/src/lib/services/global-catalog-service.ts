import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { GlobalPartCatalog, GlobalServiceCatalog } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────

export interface GlobalPartSearchFilters {
  category?: string;
  limit?: number;
  offset?: number;
}

export interface GlobalServiceSearchFilters {
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ── Global Parts Search ───────────────────────────────────────

/**
 * Search the global parts catalog by name, part number, or category.
 * Returns active parts ordered by category then name.
 */
export async function searchGlobalParts(
  db: SupabaseClient,
  query?: string,
  filters?: GlobalPartSearchFilters,
): Promise<GlobalPartCatalog[]> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let q = db.from("global_parts_catalog").select("*").eq("is_active", true);

  if (query?.trim()) {
    const escaped = query.trim().replace(/'/g, "''");
    q = q.or(
      `name.ilike.%${escaped}%,name_mn.ilike.%${escaped}%,part_number.ilike.%${escaped}%,category.ilike.%${escaped}%`,
    );
  }

  if (filters?.category) {
    q = q.eq("category", filters.category);
  }

  q = q
    .order("category")
    .order("name")
    .range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get a single global part by its ID.
 */
export async function getGlobalPartById(
  db: SupabaseClient,
  id: string,
): Promise<GlobalPartCatalog> {
  const { data, error } = await db
    .from("global_parts_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new NotFoundError(`Global part not found: ${id}`);
  return data;
}

// ── Global Services Search ────────────────────────────────────

/**
 * Search the global services catalog by name or category.
 * Returns active services ordered by category then name.
 */
export async function searchGlobalServices(
  db: SupabaseClient,
  query?: string,
  filters?: GlobalServiceSearchFilters,
): Promise<GlobalServiceCatalog[]> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let q = db.from("global_services_catalog").select("*").eq("is_active", true);

  if (query?.trim()) {
    const escaped = query.trim().replace(/'/g, "''");
    q = q.or(
      `name.ilike.%${escaped}%,name_mn.ilike.%${escaped}%,category.ilike.%${escaped}%`,
    );
  }

  if (filters?.category) {
    q = q.eq("category", filters.category);
  }

  q = q
    .order("category")
    .order("name")
    .range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Import Global Parts to Org ────────────────────────────────

/**
 * Import selected global parts into an organization's local parts_catalog.
 *
 * Skips parts that have already been imported (matched by global_part_id
 * within the same org). Returns counts of imported vs skipped records.
 */
export async function importGlobalPartsToOrg(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  partIds: string[],
): Promise<ImportResult> {
  if (!orgId) throw new ValidationError("Organization ID is required");
  if (!partIds.length)
    throw new ValidationError("No parts selected for import");

  // Fetch global parts to import
  const { data: globalParts, error: fetchError } = await db
    .from("global_parts_catalog")
    .select("*")
    .in("id", partIds)
    .eq("is_active", true);

  if (fetchError) throw new Error(fetchError.message);
  if (!globalParts?.length)
    throw new NotFoundError("No active global parts found for given IDs");

  // Check which ones already exist in the org
  const { data: existing } = await db
    .from("parts_catalog")
    .select("global_part_id")
    .eq("organization_id", orgId)
    .in("global_part_id", partIds)
    .is("deleted_at", null);

  const existingIds = new Set(
    (existing ?? [])
      .map((p: { global_part_id: string | null }) => p.global_part_id)
      .filter(Boolean),
  );

  const recordsToInsert = globalParts
    .filter((gp: GlobalPartCatalog) => !existingIds.has(gp.id))
    .map((gp: GlobalPartCatalog) => ({
      organization_id: orgId,
      name: gp.name,
      name_mn: gp.name_mn,
      part_number: gp.part_number,
      category: gp.category,
      description: gp.description,
      unit: gp.unit,
      global_part_id: gp.id,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    }));

  if (!recordsToInsert.length) {
    return { imported: 0, skipped: globalParts.length, errors: [] };
  }

  const { error: insertError } = await db
    .from("parts_catalog")
    .insert(recordsToInsert);

  if (insertError) throw new Error(insertError.message);

  return {
    imported: recordsToInsert.length,
    skipped: globalParts.length - recordsToInsert.length,
    errors: [],
  };
}
