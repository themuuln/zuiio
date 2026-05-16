import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
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
  return withCache(
    ["getPartsCars", orgId],
    async () => {
      const { data, error } = await supabase
        .from("parts_cars")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    { tags: [cacheTags.partsCars(orgId)] },
  );
}

export async function getPartsCar(
  orgId: string,
  carId: string,
): Promise<PartsCars> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .select("*")
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
      arrival_date: params.arrival_date ?? new Date().toISOString().split("T")[0],
      status: "arrived",
      notes: params.notes ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCars(orgId));
  return data;
}

export async function updatePartsCar(
  orgId: string,
  carId: string,
  params: Partial<PartsCarsUpdate>,
): Promise<PartsCars> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_cars")
    .update({ ...params, updated_by: (await supabase.auth.getUser()).data.user?.id })
    .eq("id", carId)
    .eq("organization_id", orgId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update");
  revalidateTag(cacheTags.partsCars(orgId));
  return data;
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
  revalidateTag(cacheTags.partsCars(orgId));
}

// ── Parts Car Parts ───────────────────────────────────────────

export async function getPartsCarParts(
  orgId: string,
  carId: string,
): Promise<PartsCarParts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_car_parts")
    .select("*")
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
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCarParts(carId));
  return data;
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
  revalidateTag(cacheTags.partsCarParts(carId));
}

// ── Disassembly Complete ──────────────────────────────────────

export async function completeDisassembly(
  orgId: string,
  userId: string,
  carId: string,
): Promise<PartsCars> {
  const supabase = await createClient();

  const car = await getPartsCar(orgId, carId);
  if (car.status === "completed") {
    throw new ValidationError("Disassembly already completed");
  }

  const { data: parts } = await supabase
    .from("parts_car_parts")
    .select("*")
    .eq("parts_car_id", carId)
    .eq("organization_id", orgId);

  const totalParts = parts?.length ?? 0;
  const totalValue =
    parts?.reduce((sum, p) => sum + (p.estimated_price ?? 0) * (p.quantity ?? 1), 0) ?? 0;

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
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to complete");
  revalidateTag(cacheTags.partsCars(orgId));
  revalidateTag(cacheTags.partsCarParts(carId));
  return data;
}
