import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { cacheTags } from "@/lib/cache/keys";
import type {
  PartsCars,
  PartsCarsInsert,
  PartsCarsUpdate,
  PartsCarParts,
  PartsCarPartsInsert,
} from "@/lib/types";

// ── Parts Cars ────────────────────────────────────────────────

export async function getPartsCars(orgId: string): Promise<PartsCars[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .select(
      "id, organization_id, branch_id, make, model, year, vin, license_plate, purchase_cost, currency, arrival_date, status, total_parts_actual, total_estimated_value, notes, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PartsCars[];
}

export async function getPartsCar(
  orgId: string,
  carId: string,
): Promise<PartsCars> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .select(
      "id, organization_id, branch_id, make, model, year, vin, license_plate, purchase_cost, currency, arrival_date, status, total_parts_actual, total_estimated_value, notes, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", carId)
    .eq("organization_id", orgId)
    .single();
  if (error || !data) throw new NotFoundError("Parts car not found");
  return data;
}

export async function createPartsCar(
  orgId: string,
  userId: string,
  params: Partial<PartsCarsInsert>,
): Promise<PartsCars> {
  if (!params.make || !params.model) {
    throw new ValidationError("Make and model are required");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .insert({
      organization_id: orgId,
      make: params.make,
      model: params.model,
      year: params.year ?? null,
      vin: params.vin ?? null,
      license_plate: params.license_plate ?? null,
      purchase_cost: params.purchase_cost ?? 0,
      currency: params.currency ?? "MNT",
      arrival_date:
        params.arrival_date ?? new Date().toISOString().split("T")[0],
      status: "arrived",
      notes: params.notes ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, branch_id, make, model, year, vin, license_plate, purchase_cost, currency, arrival_date, status, total_parts_actual, total_estimated_value, notes, created_by, updated_by, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCars(orgId), "max");
  return data as unknown as PartsCars;
}

export async function updatePartsCar(
  orgId: string,
  carId: string,
  params: Partial<PartsCarsUpdate>,
): Promise<PartsCars> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .update({
      ...params,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", carId)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, branch_id, make, model, year, vin, license_plate, purchase_cost, currency, arrival_date, status, total_parts_actual, total_estimated_value, notes, created_by, updated_by, created_at, updated_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update");
  revalidateTag(cacheTags.partsCars(orgId), "max");
  return data as unknown as PartsCars;
}

export async function deletePartsCar(
  orgId: string,
  carId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("parts_cars")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", carId)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCars(orgId), "max");
}

// ── Parts Car Parts ───────────────────────────────────────────

export async function getPartsCarParts(
  orgId: string,
  carId: string,
): Promise<PartsCarParts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_car_parts")
    .select(
      "id, organization_id, parts_car_id, part_id, name, location_group, quantity, condition, estimated_price, notes, created_by, updated_by, created_at, updated_at",
    )
    .eq("parts_car_id", carId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addPartsCarPart(
  orgId: string,
  userId: string,
  carId: string,
  params: Partial<PartsCarPartsInsert>,
): Promise<PartsCarParts> {
  if (!params.name) throw new ValidationError("Part name is required");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_car_parts")
    .insert({
      organization_id: orgId,
      parts_car_id: carId,
      name: params.name,
      part_id: params.part_id ?? null,
      location_group: params.location_group ?? "other",
      quantity: params.quantity ?? 1,
      condition: params.condition ?? "good",
      estimated_price: params.estimated_price ?? 0,
      notes: params.notes ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, parts_car_id, part_id, name, location_group, quantity, condition, estimated_price, notes, created_by, updated_by, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCarParts(carId), "max");
  return data as unknown as PartsCarParts;
}

export async function removePartsCarPart(
  orgId: string,
  carId: string,
  partId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("parts_car_parts")
    .delete()
    .eq("id", partId)
    .eq("parts_car_id", carId)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCarParts(carId), "max");
}

// ── Disassembly Complete ──────────────────────────────────────

export async function completeDisassembly(
  orgId: string,
  userId: string,
  carId: string,
): Promise<PartsCars> {
  const supabase = await createClient();

  const [car, { data: parts }] = await Promise.all([
    getPartsCar(orgId, carId),
    supabase
      .from("parts_car_parts")
      .select(
        "id, organization_id, parts_car_id, part_id, name, location_group, quantity, condition, estimated_price, notes, created_by, updated_by, created_at, updated_at",
      )
      .eq("parts_car_id", carId)
      .eq("organization_id", orgId),
  ]);
  if (car.status === "completed") {
    throw new ValidationError("Disassembly already completed");
  }

  const totalParts = parts?.length ?? 0;
  const totalValue =
    parts?.reduce(
      (sum, p) => sum + (p.estimated_price ?? 0) * (p.quantity ?? 1),
      0,
    ) ?? 0;

  const { data, error } = await supabase
    .from("parts_cars")
    .update({
      status: "completed",
      total_parts_actual: totalParts,
      total_estimated_value: totalValue,
      updated_by: userId,
    })
    .eq("id", carId)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, branch_id, make, model, year, vin, license_plate, purchase_cost, currency, arrival_date, status, total_parts_actual, total_estimated_value, notes, created_by, updated_by, created_at, updated_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to complete");
  revalidateTag(cacheTags.partsCars(orgId), "max");
  revalidateTag(cacheTags.partsCarParts(carId), "max");
  return data as unknown as PartsCars;
}

// ── Publish to Catalog ─────────────────────────────────────────

export async function publishPartsCarPartsToCatalog(
  orgId: string,
  userId: string,
  carId: string,
): Promise<{ publishedCount: number; catalogIds: string[] }> {
  const supabase = await createClient();

  // Get all parts from this car that don't have a linked catalog entry
  const { data: parts, error: partsError } = await supabase
    .from("parts_car_parts")
    .select(
      "id, name, quantity, estimated_price, location_group, condition, notes",
    )
    .eq("parts_car_id", carId)
    .eq("organization_id", orgId)
    .is("part_id", null);

  if (partsError) throw new Error(partsError.message);
  if (!parts?.length) throw new ValidationError("No unlinked parts to publish");

  const catalogIds: string[] = [];

  for (const part of parts) {
    // Create catalog entry
    const { data: catalogItem, error: catalogError } = await supabase
      .from("parts_catalog")
      .insert({
        organization_id: orgId,
        name: part.name,
        name_mn: null,
        part_number: null,
        category: part.location_group ?? "other",
        default_price: part.estimated_price ?? 0,
        purchase_price: 0,
        unit: "pcs",
        min_stock: 0,
        max_stock: 999,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .select("id")
      .single();

    if (catalogError) {
      console.error(
        `Failed to create catalog entry for part ${part.id}:`,
        catalogError,
      );
      continue;
    }

    catalogIds.push(catalogItem.id);

    // Link parts_car_parts to catalog
    const { error: linkError } = await supabase
      .from("parts_car_parts")
      .update({ part_id: catalogItem.id, updated_by: userId })
      .eq("id", part.id)
      .eq("organization_id", orgId);

    if (linkError) {
      console.error(`Failed to link part ${part.id} to catalog:`, linkError);
    }

    // Create inventory movement (type = disassembly, adds stock)
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        organization_id: orgId,
        part_id: catalogItem.id,
        movement_type: "disassembly",
        quantity: part.quantity ?? 1,
        unit_cost: 0,
        unit_price: part.estimated_price ?? 0,
        reference_type: "parts_car",
        reference_id: carId,
        notes: "Published from parts car disassembly",
        created_by: userId,
      });

    if (movementError) {
      console.error(
        `Failed to create inventory movement for part ${catalogItem.id}:`,
        movementError,
      );
    }
  }

  // Invalidate caches
  revalidateTag(cacheTags.partsCars(orgId), "max");
  revalidateTag(cacheTags.partsCarParts(carId), "max");
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  revalidateTag(cacheTags.inventoryMovements(orgId), "max");

  return { publishedCount: catalogIds.length, catalogIds };
}
