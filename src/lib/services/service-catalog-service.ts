import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  ServiceCatalog,
  ServicePriceHistory,
  VehicleModel,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

export async function getServices(
  db: SupabaseClient,
  orgId: string,
  category?: string,
  limit = 50,
): Promise<ServiceCatalog[]> {
  const supabase = db;
  let query = supabase
    .from("service_catalog")
    .select(
      "id, organization_id, name, name_mn, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.limit(limit + 1);

  if (error) throw new Error(error.message ?? "Failed to fetch services");
  return (data ?? []) as unknown as ServiceCatalog[];
}

export async function getService(
  db: SupabaseClient,
  id: string,
): Promise<ServiceCatalog> {
  const supabase = db;
  const { data, error } = await supabase
    .from("service_catalog")
    .select(
      "id, organization_id, name, name_mn, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, global_service_id, branch_id, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Service not found");
  return data;
}

export async function createService(
  db: SupabaseClient,
  orgId: string,
  params: {
    name: string;
    name_mn?: string;
    category?: string;
    description?: string;
    default_price: number;
  },
): Promise<ServiceCatalog> {
  if (!params.name?.trim())
    throw new ValidationError("Service name is required");

  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("service_catalog")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      name_mn: params.name_mn?.trim() ?? null,
      category: params.category?.trim() ?? null,
      description: params.description?.trim() ?? null,
      default_price: params.default_price,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, name, name_mn, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, branch_id, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create service");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data as unknown as ServiceCatalog;
}

export async function updateService(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: {
    name?: string;
    name_mn?: string;
    category?: string;
    description?: string;
    default_price?: number;
    is_active?: boolean;
  },
): Promise<ServiceCatalog> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const fieldMap: FieldMap<typeof params> = {
    columns: {
      name: "name",
      name_mn: "name_mn",
      category: "category",
      description: "description",
      default_price: "default_price",
      is_active: "is_active",
    },
    transforms: {
      name: trimField,
      name_mn: trimField,
      category: trimField,
      description: trimField,
    },
  };

  const updates = buildUpdates(params, fieldMap);
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("service_catalog")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, name, name_mn, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, branch_id, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Service not found");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data as unknown as ServiceCatalog;
}

export async function deleteService(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("service_catalog")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Service not found or already deleted");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
}

export async function getLastSoldPrice(
  db: SupabaseClient,
  orgId: string,
  serviceCatalogId: string,
  vehicleMake?: string,
  vehicleModel?: string,
): Promise<ServicePriceHistory | null> {
  const supabase = db;
  let query = supabase
    .from("service_price_history")
    .select(
      "id, organization_id, service_catalog_id, vehicle_make, vehicle_model, unit_price, discount_amount, discount_percentage, quantity, final_price, work_order_id, mechanic_id, vehicle_id, service_name, created_at",
    )
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (vehicleMake) {
    query = query.eq("vehicle_make", vehicleMake);
  }
  if (vehicleModel) {
    query = query.eq("vehicle_model", vehicleModel);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return null;
  return data as unknown as ServicePriceHistory | null;
}

export interface VehicleModelServiceRow {
  id: string;
  vehicle_model_id: string;
  vehicle_model_make: string;
  vehicle_model_model: string;
  specific_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SERVICE_VMS_SELECT =
  "id, vehicle_model_id, specific_price, notes, created_at, updated_at, vehicle_model:vehicle_models!vehicle_model_id(make, model)";

/**
 * Get all vehicle model service prices for a given service.
 * Returns rows with joined vehicle model info (make, model).
 */
export async function getServiceVehicleModels(
  db: SupabaseClient,
  orgId: string,
  serviceCatalogId: string,
): Promise<VehicleModelServiceRow[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("vehicle_model_services")
    .select(SERVICE_VMS_SELECT)
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(
      error.message ?? "Failed to fetch vehicle model service prices",
    );

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>) => {
      const vehicleModel = row.vehicle_model as {
        make: string;
        model: string;
      } | null;
      return {
        id: row.id as string,
        vehicle_model_id: row.vehicle_model_id as string,
        vehicle_model_make: vehicleModel?.make ?? "",
        vehicle_model_model: vehicleModel?.model ?? "",
        specific_price: (row.specific_price as number) ?? null,
        notes: (row.notes as string) ?? null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      };
    },
  );
}

/**
 * Upsert a vehicle model service price.
 * Creates or updates the specific_price for a service+vehicle_model combination.
 */
export async function upsertServiceVehicleModelPrice(
  db: SupabaseClient,
  orgId: string,
  serviceCatalogId: string,
  vehicleModelId: string,
  specificPrice: number | null,
): Promise<VehicleModelServiceRow> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("vehicle_model_services")
    .upsert(
      {
        organization_id: orgId,
        service_catalog_id: serviceCatalogId,
        vehicle_model_id: vehicleModelId,
        specific_price: specificPrice,
        created_by: userId,
        updated_by: userId,
      },
      {
        onConflict: "vehicle_model_id, service_catalog_id",
        ignoreDuplicates: false,
      },
    )
    .select(SERVICE_VMS_SELECT)
    .single();

  if (error || !data)
    throw new Error(
      error?.message ?? "Failed to upsert vehicle model service price",
    );

  const vm = (data as unknown as Record<string, unknown>).vehicle_model as {
    make: string;
    model: string;
  } | null;
  const raw = data as unknown as Record<string, unknown>;

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return {
    id: raw.id as string,
    vehicle_model_id: raw.vehicle_model_id as string,
    vehicle_model_make: vm?.make ?? "",
    vehicle_model_model: vm?.model ?? "",
    specific_price: raw.specific_price as number | null,
    notes: raw.notes as string | null,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

/**
 * Delete a vehicle model service price entry.
 */
export async function deleteServiceVehicleModelPrice(
  db: SupabaseClient,
  orgId: string,
  serviceCatalogId: string,
  vehicleModelId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("vehicle_model_services")
    .delete()
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .eq("vehicle_model_id", vehicleModelId);

  if (error)
    throw new Error(
      error.message ?? "Failed to delete vehicle model service price",
    );

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
}

/**
 * Get all vehicle models for an org (for the model picker UI).
 */
export async function getOrgVehicleModels(
  db: SupabaseClient,
  orgId: string,
): Promise<Pick<VehicleModel, "id" | "make" | "model">[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("vehicle_models")
    .select("id, make, model")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("make")
    .order("model");

  if (error) throw new Error(error.message ?? "Failed to fetch vehicle models");
  return (data ?? []) as Pick<VehicleModel, "id" | "make" | "model">[];
}

export async function getServicePriceHistory(
  db: SupabaseClient,
  orgId: string,
  serviceCatalogId: string,
): Promise<ServicePriceHistory[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("service_price_history")
    .select(
      "id, organization_id, service_catalog_id, vehicle_make, vehicle_model, unit_price, discount_amount, discount_percentage, quantity, final_price, work_order_id, mechanic_id, vehicle_id, service_name, created_at",
    )
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message ?? "Failed to fetch price history");
  return (data ?? []) as unknown as ServicePriceHistory[];
}

/**
 * Get a count of custom model-specific prices per service for the whole org.
 * Returns a map: service_catalog_id → count of models with non-null specific_price.
 * Used to avoid N+1 queries on the services listing page.
 */
export async function getServiceModelPriceCounts(
  db: SupabaseClient,
  orgId: string,
): Promise<Record<string, number>> {
  const supabase = db;
  const { data, error } = await supabase
    .from("vehicle_model_services")
    .select("service_catalog_id, specific_price")
    .eq("organization_id", orgId)
    .not("specific_price", "is", null);

  if (error)
    throw new Error(error.message ?? "Failed to fetch model price counts");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const sid = row.service_catalog_id as string;
    counts[sid] = (counts[sid] || 0) + 1;
  }
  return counts;
}
