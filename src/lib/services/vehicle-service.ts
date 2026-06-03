import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  isValidMongolianPlate,
  normalizeMongolianPlate,
} from "@/lib/form-validation";
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateVehicleParams,
  UpdateVehicleParams,
  Vehicle,
  VehicleDetail,
  VehicleWithOwner,
  WorkOrder,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";

import { ensureVehicleModel } from "./vehicle-models-service";

/**
 * Lists all vehicles for an organization with optional filtering.
 */
export async function getVehicles(
  db: SupabaseClient,
  orgId: string,
  options?: {
    search?: string;
    customerId?: string;
    limit?: number;
    branchId?: string | null;
  },
): Promise<VehicleWithOwner[]> {
  const supabase = db; // Not wrapped with withCache — revalidateTag doesn't reliably invalidate
  // unstable_cache in Next.js 16, causing stale reads after mutations.
  // Client-side caching is handled by React Query (staleTime 30s).
  let query = supabase
    .from("vehicles")
    .select(
      "*, vehicle_owners(customer_id, customers(first_name, last_name, phone))",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .is("vehicle_owners.owned_until", null)
    .order("created_at", { ascending: false });

  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`plate_number.ilike.${term},vin.ilike.${term}`);
  }

  if (options?.customerId) {
    query = query.eq("vehicle_owners.customer_id", options.customerId);
  }

  if (options?.branchId) query = withBranchFilter(query, options.branchId);

  const { data, error } = await query.limit((options?.limit ?? 50) + 1);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const owners = (row.vehicle_owners as Record<string, unknown>[]) ?? [];
    const primaryOwner = owners[0];
    const customer = (primaryOwner?.customers as Record<string, unknown>) ?? {};
    return {
      ...(row as unknown as Vehicle),
      owner_name:
        [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        null,
      owner_phone: (customer.phone as string) ?? null,
    } as unknown as VehicleWithOwner;
  });
}

/**
 * Returns a single vehicle with owner info and service history.
 */
export async function getVehicle(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<VehicleDetail> {
  const supabase = db;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !vehicle) {
    throw new NotFoundError("Vehicle not found");
  }

  // Get owners and recent work orders in parallel
  const [{ data: owners }, { data: workOrders }] = await Promise.all([
    supabase
      .from("vehicle_owners")
      .select(
        "customer_id, is_primary, customers(first_name, last_name, phone)",
      )
      .eq("vehicle_id", id)
      .eq("organization_id", orgId)
      .is("owned_until", null),
    supabase
      .from("work_orders")
      .select("id, status, complaint, total, created_at")
      .eq("vehicle_id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    ...vehicle,
    owners: (owners ?? []).map((o: Record<string, unknown>) => {
      const c = (o.customers as Record<string, unknown>) ?? {};
      return {
        customer_id: o.customer_id as string,
        name:
          [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown",
        phone: (c.phone as string) ?? null,
        is_primary: o.is_primary as boolean,
      };
    }),
    recent_work_orders: (workOrders ?? []).map(
      (wo: Record<string, unknown>) => ({
        id: wo.id as string,
        status: wo.status as string,
        complaint: (wo.complaint as string) ?? null,
        total: wo.total as number,
        created_at: wo.created_at as string,
      }),
    ),
  };
}

/**
 * Creates a vehicle and links it to a customer via vehicle_owners.
 */
export async function createVehicle(
  db: SupabaseClient,
  orgId: string,
  params: CreateVehicleParams,
  userId: string,
): Promise<Vehicle> {
  const plate = normalizeMongolianPlate(params.plateNumber?.trim() ?? "");

  if (!plate) {
    throw new ValidationError("Plate number is required");
  }
  if (!isValidMongolianPlate(plate)) {
    throw new ValidationError(
      "Plate must be 4 digits followed by 3 Cyrillic letters (e.g. 4444УНА)",
    );
  }
  if (!params.make?.trim()) {
    throw new ValidationError("Make is required");
  }
  if (!params.model?.trim()) {
    throw new ValidationError("Model is required");
  }

  const supabase = db;

  // Check for duplicate plate
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id, plate_number")
    .eq("organization_id", orgId)
    .eq("plate_number", plate)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    throw new ConflictError(
      `A vehicle with plate number "${plate}" already exists`,
    );
  }

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  // Create vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      plate_number: plate,
      vin: params.vin?.trim() || null,
      chassis_number: params.chassisNumber?.trim() || null,
      make: params.make.trim(),
      model: params.model.trim(),
      year: params.year ?? null,
      trim: params.trim?.trim() || null,
      color: params.color?.trim() || null,
      engine: params.engine?.trim() || null,
      fuel_type: params.fuelType || null,
      transmission: params.transmission || null,
      drivetrain: params.drivetrain || null,
      body_type: params.bodyType || null,
      odometer: params.odometer ?? null,
      notes: params.notes?.trim() || null,
      license_expiry_at: params.licenseExpiryAt || null,
      next_service_at: params.nextServiceAt || null,
      import_date: params.importDate || null,
      country_of_origin: params.countryOfOrigin?.trim() || null,
      category: params.category?.trim() || null,
      seats: params.seats ?? null,
      steering: params.steering || null,
      height: params.height ?? null,
      width: params.width ?? null,
      length: params.length ?? null,
      weight: params.weight ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (vehicleError || !vehicle) {
    throw new Error(vehicleError?.message ?? "Failed to create vehicle");
  }

  // Link to customer
  if (params.customerId) {
    const { error: ownerError } = await supabase.from("vehicle_owners").insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      vehicle_id: vehicle.id,
      customer_id: params.customerId,
      is_primary: true,
      created_by: userId,
    });

    if (ownerError) {
      // Cleanup vehicle on owner link failure
      await supabase.from("vehicles").delete().eq("id", vehicle.id);
      throw new Error(ownerError.message);
    }
  }

  // Auto-learn make+model into catalog (fire-and-forget)
  ensureVehicleModel(orgId, params.make, params.model).catch(() => {
    // Silently ignore — catalog learning must never block vehicle creation
  });

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "vehicles",
    record_id: vehicle.id,
    user_id: userId,
    organization_id: orgId,
    new_data: vehicle as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.vehicles(orgId), "max");

  return vehicle;
}

/**
 * Updates a vehicle.
 */
export async function updateVehicle(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateVehicleParams,
  userId: string,
): Promise<Vehicle> {
  const supabase = db;
  const { data: existing, error: fetchError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Vehicle not found");
  }

  // Plate has special validation — handle separately
  const plateUpdates: Record<string, unknown> = {};
  if (params.plateNumber !== undefined) {
    const normalized = normalizeMongolianPlate(
      params.plateNumber?.trim() ?? "",
    );
    if (normalized && !isValidMongolianPlate(normalized)) {
      throw new ValidationError(
        "Plate must be 4 digits followed by 3 Cyrillic letters (e.g. 4444УНА)",
      );
    }
    plateUpdates.plate_number = normalized || null;
  }

  const trim = (v: unknown) => (v as string).trim() || null;
  const vehicleFieldMap: FieldMap<UpdateVehicleParams> = {
    columns: {
      vin: "vin",
      chassisNumber: "chassis_number",
      make: "make",
      model: "model",
      year: "year",
      trim: "trim",
      color: "color",
      engine: "engine",
      fuelType: "fuel_type",
      transmission: "transmission",
      drivetrain: "drivetrain",
      bodyType: "body_type",
      odometer: "odometer",
      notes: "notes",
      licenseExpiryAt: "license_expiry_at",
      nextServiceAt: "next_service_at",
      importDate: "import_date",
      countryOfOrigin: "country_of_origin",
      category: "category",
      seats: "seats",
      steering: "steering",
      height: "height",
      width: "width",
      length: "length",
      weight: "weight",
    },
    transforms: {
      vin: trim,
      chassisNumber: trim,
      make: (v) => (v as string).trim(),
      model: (v) => (v as string).trim(),
      trim: trim,
      color: trim,
      engine: trim,
      notes: trim,
      steering: trim,
    },
  };
  const updates = {
    ...plateUpdates,
    ...buildUpdates(params, vehicleFieldMap),
    updated_by: userId,
  };

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update vehicle");
  }

  // Update customer link if changed
  if (params.customerId !== undefined && params.customerId !== null) {
    // Deactivate old ownership
    await supabase
      .from("vehicle_owners")
      .update({ owned_until: new Date().toISOString() })
      .eq("vehicle_id", id)
      .is("owned_until", null);

    // Create new ownership
    await supabase.from("vehicle_owners").insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      vehicle_id: id,
      customer_id: params.customerId,
      is_primary: true,
      created_by: userId,
    });
  }

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "vehicles",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existing as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.vehicles(orgId), "max");

  return data;
}

/**
 * Soft-deletes a vehicle.
 */
export async function deleteVehicle(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId: string,
): Promise<void> {
  const supabase = db;
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    throw new NotFoundError("Vehicle not found");
  }

  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "vehicles",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.vehicles(orgId), "max");
}

/**
 * Fast plate number search using LIKE query.
 */
export async function searchByPlate(
  db: SupabaseClient,
  orgId: string,
  search: string,
): Promise<VehicleWithOwner[]> {
  return getVehicles(db, orgId, { search });
}

/**
 * Gets work orders and services for a specific vehicle.
 */
export async function getVehicleServiceHistory(
  db: SupabaseClient,
  orgId: string,
  vehicleId: string,
): Promise<(WorkOrder & { work_order_services: Record<string, unknown>[] })[]> {
  const supabase = db;
  const { data: workOrders, error } = await supabase
    .from("work_orders")
    .select("*, work_order_services(*)")
    .eq("organization_id", orgId)
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (workOrders ?? []) as (WorkOrder & {
    work_order_services: Record<string, unknown>[];
  })[];
}

/**
 * Gets all vehicles owned by a specific customer.
 */
export async function getCustomerVehicles(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
): Promise<VehicleWithOwner[]> {
  const supabase = db;
  const { data: owners, error } = await supabase
    .from("vehicle_owners")
    .select("vehicle_id, vehicles(*)")
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("owned_until", null);

  if (error) throw new Error(error.message);

  return (owners ?? []).map((o: Record<string, unknown>) => {
    const v = (o.vehicles as Record<string, unknown>) ?? {};
    return {
      ...(v as unknown as Vehicle),
      owner_name: null,
      owner_phone: null,
    } as unknown as VehicleWithOwner;
  });
}

/**
 * Gets work orders for a specific customer with vehicle info.
 */
export async function getCustomerWorkOrders(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
): Promise<
  (WorkOrder & {
    work_order_services: Record<string, unknown>[];
    vehicles?: { plate_number: string; make: string; model: string } | null;
  })[]
> {
  const supabase = db;
  const { data: workOrders, error } = await supabase
    .from("work_orders")
    .select("*, work_order_services(*), vehicles(plate_number, make, model)")
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  return (workOrders ?? []) as (WorkOrder & {
    work_order_services: Record<string, unknown>[];
    vehicles?: { plate_number: string; make: string; model: string } | null;
  })[];
}
