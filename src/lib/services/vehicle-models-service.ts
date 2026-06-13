import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { VehicleModel } from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

export async function getVehicleModels(
  db: SupabaseClient,
  orgId: string,
  make?: string,
): Promise<VehicleModel[]> {
  const supabase = db;

  let query = supabase
    .from("vehicle_models")
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("make")
    .order("model");

  if (make) {
    query = query.eq("make", make);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to fetch vehicle models");
  return (data ?? []) as unknown as VehicleModel[];
}

export async function getVehicleModel(
  db: SupabaseClient,
  id: string,
): Promise<VehicleModel> {
  const supabase = db;

  const { data, error } = await supabase
    .from("vehicle_models")
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Vehicle model not found");
  return data;
}

export async function getDistinctMakes(
  db: SupabaseClient,
  orgId: string,
): Promise<string[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("vehicle_models")
    .select("make")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("make");

  if (error) throw new Error(error.message ?? "Failed to fetch makes");

  const makes = [...new Set(data.map((r) => r.make))];
  return makes;
}

export async function createVehicleModel(
  db: SupabaseClient,
  orgId: string,
  params: {
    make: string;
    model: string;
    generation?: string | null;
    year_start?: number | null;
    year_end?: number | null;
    engine?: string | null;
    body_type?: string | null;
    class?: string | null;
  },
): Promise<VehicleModel> {
  if (!params.make?.trim()) throw new ValidationError("Make is required");
  if (!params.model?.trim()) throw new ValidationError("Model is required");
  if (
    params.year_start != null &&
    params.year_end != null &&
    params.year_start > params.year_end
  ) {
    throw new ValidationError(
      "Year start must be less than or equal to year end",
    );
  }

  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("vehicle_models")
    .insert({
      organization_id: orgId,
      make: params.make.trim(),
      model: params.model.trim(),
      generation: params.generation?.trim() ?? null,
      year_start: params.year_start ?? null,
      year_end: params.year_end ?? null,
      engine: params.engine?.trim() ?? null,
      body_type: params.body_type?.trim() ?? null,
      class: params.class?.trim() ?? null,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create vehicle model");

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "vehicle_models",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.vehicleModels(orgId), "max");

  return data as unknown as VehicleModel;
}

export async function updateVehicleModel(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: {
    make?: string;
    model?: string;
    generation?: string | null;
    year_start?: number | null;
    year_end?: number | null;
    engine?: string | null;
    body_type?: string | null;
    class?: string | null;
    is_active?: boolean;
  },
): Promise<VehicleModel> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (
    params.year_start != null &&
    params.year_end != null &&
    params.year_start > params.year_end
  ) {
    throw new ValidationError(
      "Year start must be less than or equal to year end",
    );
  }

  const fieldMap: FieldMap<typeof params> = {
    columns: {
      make: "make",
      model: "model",
      generation: "generation",
      year_start: "year_start",
      year_end: "year_end",
      engine: "engine",
      body_type: "body_type",
      class: "class",
      is_active: "is_active",
    },
    transforms: {
      make: trimField,
      model: trimField,
      generation: trimField,
      engine: trimField,
      body_type: trimField,
      class: trimField,
    },
  };

  const updates = buildUpdates(params, fieldMap) as Partial<VehicleModel>;
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("vehicle_models")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Vehicle model not found");

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "vehicle_models",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.vehicleModels(orgId), "max");

  return data as unknown as VehicleModel;
}

export async function deleteVehicleModel(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("vehicle_models")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error)
    throw new NotFoundError("Vehicle model not found or already deleted");

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "vehicle_models",
    record_id: id,
    user_id: currentUser?.id,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.vehicleModels(orgId), "max");
}

/**
 * Ensures a make+model pair exists in the vehicle_models catalog.
 * Creates it if missing. Safe to call on every vehicle creation.
 */
export async function ensureVehicleModel(
  db: SupabaseClient,
  orgId: string,
  make: string,
  model: string,
): Promise<void> {
  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  if (!normalizedMake || !normalizedModel) return;

  const supabase = db;

  const { count, error } = await supabase
    .from("vehicle_models")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("make", normalizedMake)
    .eq("model", normalizedModel)
    .is("deleted_at", null);

  if (error) return;

  if (count === 0) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("vehicle_models").insert({
      organization_id: orgId,
      make: normalizedMake,
      model: normalizedModel,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    });
    revalidateTag(cacheTags.vehicleModels(orgId), "max");
  }
}
