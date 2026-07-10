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
