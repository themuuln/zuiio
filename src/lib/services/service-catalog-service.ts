import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ServiceCatalog, ServicePriceHistory } from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";

export async function getServices(
  orgId: string,
  category?: string,
  limit = 50,
): Promise<ServiceCatalog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("service_catalog")
    .select(
      "id, organization_id, name, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, created_at, updated_at, deleted_at",
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

export async function getService(id: string): Promise<ServiceCatalog> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_catalog")
    .select(
      "id, organization_id, name, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, branch_id, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Service not found");
  return data;
}

export async function createService(
  orgId: string,
  params: {
    name: string;
    category?: string;
    description?: string;
    default_price: number;
  },
): Promise<ServiceCatalog> {
  if (!params.name?.trim())
    throw new ValidationError("Service name is required");

  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("service_catalog")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      category: params.category?.trim() ?? null,
      description: params.description?.trim() ?? null,
      default_price: params.default_price,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, name, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, branch_id, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create service");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data as unknown as ServiceCatalog;
}

export async function updateService(
  id: string,
  orgId: string,
  params: {
    name?: string;
    category?: string;
    description?: string;
    default_price?: number;
    is_active?: boolean;
  },
): Promise<ServiceCatalog> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const trim = (v: unknown) => (v as string).trim() || null;

  const fieldMap: FieldMap<typeof params> = {
    columns: {
      name: "name",
      category: "category",
      description: "description",
      default_price: "default_price",
      is_active: "is_active",
    },
    transforms: {
      name: trim,
      category: trim,
      description: trim,
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
      "id, organization_id, name, category, description, default_price, is_active, estimated_duration_minutes, interval_months, interval_km, branch_id, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Service not found");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data as unknown as ServiceCatalog;
}

export async function deleteService(id: string, orgId: string): Promise<void> {
  const supabase = await createClient();

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
  orgId: string,
  serviceCatalogId: string,
  vehicleMake?: string,
  vehicleModel?: string,
): Promise<ServicePriceHistory | null> {
  const supabase = await createClient();

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

export async function getServicePriceHistory(
  orgId: string,
  serviceCatalogId: string,
): Promise<ServicePriceHistory[]> {
  const supabase = await createClient();

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
