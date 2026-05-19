import { revalidateTag } from "next/cache";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { ServiceCatalog, ServicePriceHistory } from "@/lib/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getServices(
  orgId: string,
  category?: string,
  limit = 50,
): Promise<ServiceCatalog[]> {
  const supabase = await createClient();

  return withCache(
    ["getServices", orgId, category ?? ""],
    async () => {
      let query = supabase
        .from("service_catalog")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.limit(limit + 1);

      if (error) throw new Error(error.message ?? "Failed to fetch services");
      return data ?? [];
    },
    {
      tags: [cacheTags.serviceCatalog(orgId)],
      revalidate: cacheDurations.serviceCatalog,
    },
  );
}

export async function getService(id: string): Promise<ServiceCatalog> {
  const supabase = await createClient();

  return withCache(
    ["getService", id],
    async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !data) throw new NotFoundError("Service not found");
      return data;
    },
    {
      tags: [cacheTags.serviceCatalog(id)],
      revalidate: cacheDurations.serviceCatalog,
    },
  );
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
    .select("*")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create service");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data;
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

  const updates: Record<string, unknown> = { updated_by: userId };
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.category !== undefined)
    updates.category = params.category?.trim() ?? null;
  if (params.description !== undefined)
    updates.description = params.description?.trim() ?? null;
  if (params.default_price !== undefined)
    updates.default_price = params.default_price;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data, error } = await supabase
    .from("service_catalog")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Service not found");

  revalidateTag(cacheTags.serviceCatalog(orgId), "max");

  return data;
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
    .select("*")
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
  return data;
}

export async function getServicePriceHistory(
  orgId: string,
  serviceCatalogId: string,
): Promise<ServicePriceHistory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_price_history")
    .select("*")
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message ?? "Failed to fetch price history");
  return data ?? [];
}
