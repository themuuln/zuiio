import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { VehicleModel } from "@/lib/types";
import { createCrudService } from "./create-crud-service";
import { trimField } from "./trim-field";

type CreateParams = {
  make: string;
  model: string;
  generation?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  engine?: string | null;
  body_type?: string | null;
  class?: string | null;
};

type UpdateParams = {
  make?: string;
  model?: string;
  generation?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  engine?: string | null;
  body_type?: string | null;
  class?: string | null;
  is_active?: boolean;
};

function validateYearRange(
  yearStart?: number | null,
  yearEnd?: number | null,
): void {
  if (yearStart != null && yearEnd != null && yearStart > yearEnd)
    throw new ValidationError(
      "Year start must be less than or equal to year end",
    );
}

const crud = createCrudService<VehicleModel, CreateParams, UpdateParams>({
  tableName: "vehicle_models",
  selectColumns:
    "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_at, updated_at, deleted_at",
  selectColumnsById:
    "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_by, updated_by, created_at, updated_at, deleted_at",
  cacheTagKey: (orgId: string) => cacheTags.vehicleModels(orgId),
  fieldMap: {
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
  },
  hooks: {
    beforeCreate: async (p) => {
      if (!p.make?.trim()) throw new ValidationError("Make is required");
      if (!p.model?.trim()) throw new ValidationError("Model is required");
      validateYearRange(p.year_start, p.year_end);
      return {
        make: p.make.trim(),
        model: p.model.trim(),
        generation: p.generation?.trim() ?? null,
        year_start: p.year_start ?? null,
        year_end: p.year_end ?? null,
        engine: p.engine?.trim() ?? null,
        body_type: p.body_type?.trim() ?? null,
        class: p.class?.trim() ?? null,
        is_active: true,
      } as Partial<CreateParams>;
    },
    beforeUpdate: async (_e, p) => {
      validateYearRange(p.year_start, p.year_end);
      return {};
    },
    onQuery: (query, o) => {
      // biome-ignore lint/suspicious/noExplicitAny: factory hook type is PostgrestQueryBuilder lacking order()
      let q = query as any;
      q = q
        .order("make", { ascending: true })
        .order("model", { ascending: true });
      if (o?.make) q = q.eq("make", o.make);
      return q;
    },
  },
});

export async function getVehicleModels(
  db: SupabaseClient,
  orgId: string,
  make?: string,
): Promise<VehicleModel[]> {
  const result = await crud.getAll(db, orgId, {
    pageSize: 1000,
    ...(make ? { make } : {}),
  });
  return result.data;
}

export async function getVehicleModel(
  db: SupabaseClient,
  id: string,
): Promise<VehicleModel> {
  const { data, error } = await db
    .from("vehicle_models")
    .select(
      "id, organization_id, make, model, generation, year_start, year_end, engine, body_type, class, is_active, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Vehicle model not found");
  return data as unknown as VehicleModel;
}

export async function getDistinctMakes(
  db: SupabaseClient,
  orgId: string,
): Promise<string[]> {
  const { data, error } = await db
    .from("vehicle_models")
    .select("make")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("make");
  if (error) throw new Error(error.message ?? "Failed to fetch makes");
  return [...new Set(data.map((r) => r.make))];
}

export async function createVehicleModel(
  db: SupabaseClient,
  orgId: string,
  params: CreateParams,
): Promise<VehicleModel> {
  const userId = (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return crud.create(db, orgId, params, userId);
}

export async function updateVehicleModel(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateParams,
): Promise<VehicleModel> {
  const userId = (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return crud.update(db, orgId, id, params, userId);
}

export async function deleteVehicleModel(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const userId = (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  await crud.softDelete(db, orgId, id, userId);
}

export async function ensureVehicleModel(
  db: SupabaseClient,
  orgId: string,
  make: string,
  model: string,
): Promise<void> {
  const nm = make.trim();
  const nmod = model.trim();
  if (!nm || !nmod) return;
  const { count, error } = await db
    .from("vehicle_models")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("make", nm)
    .eq("model", nmod)
    .is("deleted_at", null);
  if (error) return;
  if (count === 0) {
    const userId = (await db.auth.getUser()).data.user?.id;
    await db.from("vehicle_models").insert({
      organization_id: orgId,
      make: nm,
      model: nmod,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    });
    revalidateTag(cacheTags.vehicleModels(orgId), "max");
  }
}
