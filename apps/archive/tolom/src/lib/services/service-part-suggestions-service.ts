import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/lib/errors";

// ── Types ──────────────────────────────────────────────────────

interface ServicePartSuggestion {
  id: string;
  organization_id: string;
  service_id: string;
  part_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface ServicePartSuggestionWithPart extends ServicePartSuggestion {
  part_name: string | null;
  part_number: string | null;
}

interface AddSuggestionParams {
  partId: string;
  quantity?: number;
  notes?: string | null;
}

// ── Get Suggestions for a Service ──────────────────────────────

/**
 * Get all suggested parts for a given service.
 * Returns suggestions with embedded part catalog info.
 *
 * Returns an empty list when the org has disabled part suggestions
 * (`organizations.settings.enable_part_suggestions === false`).
 */
export async function getServicePartSuggestions(
  db: SupabaseClient,
  orgId: string,
  serviceId: string,
): Promise<ServicePartSuggestionWithPart[]> {
  // Respect the org-level feature flag (set at signup, toggleable in Settings)
  const { data: org } = await db
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .maybeSingle();

  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  if (settings.enable_part_suggestions === false) {
    return [];
  }

  const { data, error } = await db
    .from("service_part_suggestions")
    .select("*, parts_catalog!inner(name, part_number)")
    .eq("organization_id", orgId)
    .eq("service_id", serviceId);

  if (error) {
    throw new Error(error.message);
  }

  const mapped: ServicePartSuggestionWithPart[] = (data ?? []).map((item) => {
    const partsCatalog = (item as Record<string, unknown>).parts_catalog as
      | { name: string | null; part_number: string | null }
      | undefined;

    return {
      id: item.id,
      organization_id: item.organization_id,
      service_id: item.service_id,
      part_id: item.part_id,
      quantity: item.quantity,
      notes: item.notes,
      created_at: item.created_at,
      created_by: item.created_by,
      updated_at: item.updated_at,
      updated_by: item.updated_by,
      part_name: partsCatalog?.name ?? null,
      part_number: partsCatalog?.part_number ?? null,
    };
  });

  return mapped;
}

// ── Add Suggestion ─────────────────────────────────────────────

/**
 * Add a part suggestion to a service.
 * Throws ValidationError if partId is missing.
 */
export async function addServicePartSuggestion(
  db: SupabaseClient,
  orgId: string,
  serviceId: string,
  params: AddSuggestionParams,
  userId?: string,
): Promise<ServicePartSuggestion> {
  if (!params.partId?.trim()) {
    throw new ValidationError("Part ID is required");
  }

  const { data, error } = await db
    .from("service_part_suggestions")
    .insert({
      organization_id: orgId,
      service_id: serviceId,
      part_id: params.partId,
      quantity: params.quantity ?? 1,
      notes: params.notes ?? null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // Unique constraint violation
    if (error.code === "23505") {
      throw new ValidationError(
        "This part is already suggested for this service",
      );
    }
    throw new Error(error.message);
  }

  return data;
}

// ── Remove Suggestion ──────────────────────────────────────────

/**
 * Remove a part suggestion by its ID.
 * Throws NotFoundError if the suggestion doesn't exist.
 */
export async function removeServicePartSuggestion(
  db: SupabaseClient,
  orgId: string,
  id: string,
): Promise<void> {
  const { data, error } = await db
    .from("service_part_suggestions")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("id")
    .single();

  if (error || !data) {
    throw new NotFoundError("Service part suggestion not found");
  }
}
