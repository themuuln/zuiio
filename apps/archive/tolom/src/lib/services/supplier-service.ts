import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CreateSupplierParams,
  PaginatedResponse,
  Supplier,
  UpdateSupplierParams,
} from "@/lib/types";
import { createCrudService } from "./create-crud-service";
import { trimField } from "./trim-field";

// ── Types for supplier-part mapping ────────────────────────────

export interface SupplierPart {
  id: string;
  supplier_id: string;
  part_id: string;
  supplier_part_number: string | null;
  unit_cost: number | null;
  is_preferred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  part: {
    id: string;
    name: string;
    part_number: string;
    default_price: number | null;
    unit_cost: number | null;
    category: string | null;
  } | null;
}

export interface PartSupplier {
  id: string;
  supplier_id: string;
  part_id: string;
  supplier_part_number: string | null;
  unit_cost: number | null;
  is_preferred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface AddSupplierPartParams {
  supplier_id: string;
  part_id: string;
  supplier_part_number?: string | null;
  unit_cost?: number | null;
  is_preferred?: boolean;
  notes?: string | null;
}

export interface SupplierPerformance {
  supplier_id: string;
  organization_id: string;
  supplier_name: string;
  total_pos: number;
  completed_pos: number;
  total_items_ordered: number;
  total_quantity_ordered: number;
  avg_unit_cost: number;
  last_order_date: string | null;
}

export async function getSupplierPerformance(
  db: SupabaseClient,
  orgId: string,
): Promise<SupplierPerformance[]> {
  const { data, error } = await db
    .from("supplier_performance")
    .select(
      "supplier_id, organization_id, supplier_name, total_pos, completed_pos, total_items_ordered, total_quantity_ordered, avg_unit_cost, last_order_date",
    )
    .eq("organization_id", orgId)
    .order("supplier_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SupplierPerformance[];
}

// ── Factory-backed CRUD ───────────────────────────────────────

const crud = createCrudService<
  Supplier,
  CreateSupplierParams,
  UpdateSupplierParams
>({
  tableName: "suppliers",
  selectColumns:
    "id, organization_id, name, contact_person, phone, email, address, tax_id, payment_terms, notes, is_active, created_at, updated_at, created_by, updated_by",
  cacheTagKey: (orgId: string) => cacheTags.suppliers(orgId),
  orderBy: { column: "name", direction: "asc" },
  fieldMap: {
    columns: {
      name: "name",
      contact_person: "contact_person",
      phone: "phone",
      email: "email",
      address: "address",
      tax_id: "tax_id",
      payment_terms: "payment_terms",
      notes: "notes",
      is_active: "is_active",
    },
    transforms: {
      name: trimField,
      contact_person: (v) => (v as string) || null,
      phone: (v) => (v as string) || null,
      email: (v) => (v as string) || null,
      address: (v) => (v as string) || null,
      tax_id: (v) => (v as string) || null,
      payment_terms: (v) => (v as string) || null,
      notes: (v) => (v as string) || null,
    },
  },
  hooks: {
    beforeCreate: async (params) => {
      if (!params.name?.trim()) {
        throw new ValidationError("Supplier name is required");
      }
      return {
        name: params.name.trim(),
        contact_person: params.contact_person?.trim() || null,
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        address: params.address?.trim() || null,
        tax_id: params.tax_id?.trim() || null,
        payment_terms: params.payment_terms?.trim() || null,
        notes: params.notes?.trim() || null,
      } as Partial<CreateSupplierParams>;
    },
  },
});

// ── Backward-compatible wrappers ──────────────────────────────

/**
 * Get a supplier by ID.
 */
export async function getSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<Supplier> {
  return crud.getById(db, orgId, id);
}

/**
 * Get all suppliers for an organization with pagination.
 */
export async function getSuppliers(
  db: SupabaseClient,
  orgId: string,
  page?: number,
  pageSize?: number,
): Promise<PaginatedResponse<Supplier>> {
  return crud.getAll(db, orgId, { page, pageSize });
}

/**
 * Create a supplier.
 */
export async function createSupplier(
  db: SupabaseClient,
  orgId: string,
  params: CreateSupplierParams,
  userId: string,
): Promise<Supplier> {
  return crud.create(db, orgId, params, userId);
}

/**
 * Update a supplier.
 */
export async function updateSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateSupplierParams,
): Promise<Supplier> {
  const userId = (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return crud.update(db, orgId, id, params, userId);
}

/**
 * Soft-delete a supplier.
 */
export async function deleteSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const userId = (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  await crud.softDelete(db, orgId, id, userId);
}

// ── Supplier-Part Mapping ────────────────────────────────────

const PART_JOIN_SELECT = `
  id, supplier_id, part_id, supplier_part_number, unit_cost, is_preferred, notes, created_at, updated_at,
  part:parts_catalog!inner(id, name, part_number, default_price, unit_cost, category)
`;

const SUPPLIER_JOIN_SELECT = `
  id, supplier_id, part_id, supplier_part_number, unit_cost, is_preferred, notes, created_at, updated_at,
  supplier:suppliers!inner(id, name, phone, email)
`;

/**
 * Get all parts mapped to a supplier.
 * Unwraps Supabase join arrays into single objects.
 */
export async function getSupplierParts(
  db: SupabaseClient,
  orgId: string,
  supplierId: string,
): Promise<SupplierPart[]> {
  const { data, error } = await db
    .from("supplier_parts")
    .select(PART_JOIN_SELECT)
    .eq("organization_id", orgId)
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    part: Array.isArray(row.part) ? (row.part[0] ?? null) : row.part,
  })) as SupplierPart[];
}

/**
 * Get all suppliers mapped to a part.
 * Unwraps Supabase join arrays into single objects.
 */
export async function getPartSuppliers(
  db: SupabaseClient,
  orgId: string,
  partId: string,
): Promise<PartSupplier[]> {
  const { data, error } = await db
    .from("supplier_parts")
    .select(SUPPLIER_JOIN_SELECT)
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .order("is_preferred", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    supplier: Array.isArray(row.supplier)
      ? (row.supplier[0] ?? null)
      : row.supplier,
  })) as PartSupplier[];
}

/**
 * Add a part to a supplier.
 */
export async function addSupplierPart(
  db: SupabaseClient,
  orgId: string,
  params: AddSupplierPartParams,
  userId: string,
): Promise<SupplierPart> {
  // Check for duplicate
  const { data: existing } = await db
    .from("supplier_parts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("supplier_id", params.supplier_id)
    .eq("part_id", params.part_id)
    .maybeSingle();

  if (existing) {
    throw new ValidationError("This part is already mapped to this supplier");
  }

  const { data, error } = await db
    .from("supplier_parts")
    .insert({
      organization_id: orgId,
      supplier_id: params.supplier_id,
      part_id: params.part_id,
      supplier_part_number: params.supplier_part_number ?? null,
      unit_cost: params.unit_cost ?? null,
      is_preferred: params.is_preferred ?? false,
      notes: params.notes ?? null,
      created_by: userId,
    })
    .select(PART_JOIN_SELECT)
    .single();

  if (error) throw error;
  if (!data) throw new NotFoundError("Failed to create supplier-part mapping");

  // .single() already unwraps joins for a single row
  const unwrapped = (
    Array.isArray(data.part) ? { ...data, part: data.part[0] ?? null } : data
  ) as SupplierPart;

  // If this is set as preferred, unset any existing preferred for this part
  if (params.is_preferred) {
    await db
      .from("supplier_parts")
      .update({ is_preferred: false })
      .eq("organization_id", orgId)
      .eq("part_id", params.part_id)
      .neq("id", unwrapped.id)
      .eq("is_preferred", true);
  }

  return unwrapped;
}

/**
 * Remove a supplier-part mapping.
 */
export async function removeSupplierPart(
  db: SupabaseClient,
  orgId: string,
  id: string,
): Promise<void> {
  const { data, error } = await db
    .from("supplier_parts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("id")
    .single();

  if (error) throw error;
  if (!data) throw new NotFoundError("Supplier-part mapping not found");
}

/**
 * Set one supplier as preferred for a given part.
 * Unsets any existing preferred supplier for that part.
 */
export async function setPreferredSupplier(
  db: SupabaseClient,
  orgId: string,
  partId: string,
  supplierId: string,
): Promise<void> {
  // Unset all preferred for this part
  const { error: unsetError } = await db
    .from("supplier_parts")
    .update({ is_preferred: false })
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .eq("is_preferred", true);

  if (unsetError) throw unsetError;

  // Set the new one
  const { error: setError } = await db
    .from("supplier_parts")
    .update({ is_preferred: true })
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .eq("supplier_id", supplierId);

  if (setError) throw setError;
}
