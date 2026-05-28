import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import type { VehicleModel } from "@/lib/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getVehicleModels(
  orgId: string,
  make?: string,
): Promise<VehicleModel[]> {
  const supabase = await createClient();

  let query = supabase
    .from("vehicle_models")
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, is_active, created_at, updated_at, deleted_at",
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

export async function getVehicleModel(id: string): Promise<VehicleModel> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicle_models")
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, is_active, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Vehicle model not found");
  return data;
}

export async function getDistinctMakes(orgId: string): Promise<string[]> {
  const supabase = await createClient();

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
  orgId: string,
  params: {
    make: string;
    model: string;
    generation?: string | null;
    year_start?: number | null;
    year_end?: number | null;
    engine?: string | null;
    body_type?: string | null;
  },
): Promise<VehicleModel> {
  if (!params.make?.trim()) throw new ValidationError("Make is required");
  if (!params.model?.trim()) throw new ValidationError("Model is required");

  const supabase = await createClient();
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
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create vehicle model");

  revalidateTag(cacheTags.vehicleModels(orgId), "max");

  return data as unknown as VehicleModel;
}

export async function updateVehicleModel(
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
    is_active?: boolean;
  },
): Promise<VehicleModel> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const updates: Record<string, unknown> = { updated_by: userId };
  if (params.make !== undefined) updates.make = params.make.trim();
  if (params.model !== undefined) updates.model = params.model.trim();
  if (params.generation !== undefined)
    updates.generation = params.generation?.trim() ?? null;
  if (params.year_start !== undefined) updates.year_start = params.year_start;
  if (params.year_end !== undefined) updates.year_end = params.year_end;
  if (params.engine !== undefined)
    updates.engine = params.engine?.trim() ?? null;
  if (params.body_type !== undefined)
    updates.body_type = params.body_type?.trim() ?? null;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data, error } = await supabase
    .from("vehicle_models")
    .update(updates)
    .eq("id", id)
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Vehicle model not found");

  revalidateTag(cacheTags.vehicleModels(orgId), "max");

  return data as unknown as VehicleModel;
}

export async function deleteVehicleModel(
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_models")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error)
    throw new NotFoundError("Vehicle model not found or already deleted");

  revalidateTag(cacheTags.vehicleModels(orgId), "max");
}

/**
 * Ensures a make+model pair exists in the vehicle_models catalog.
 * Creates it if missing. Safe to call on every vehicle creation.
 */
export async function ensureVehicleModel(
  orgId: string,
  make: string,
  model: string,
): Promise<void> {
  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  if (!normalizedMake || !normalizedModel) return;

  const supabase = await createClient();

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
