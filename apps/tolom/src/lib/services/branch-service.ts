import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  Branch,
  CreateBranchParams,
  UpdateBranchParams,
} from "@/lib/types";
import { createCrudService } from "./create-crud-service";
import { trimField } from "./trim-field";

// ── Factory-backed CRUD ───────────────────────────────────────

const crud = createCrudService<Branch, CreateBranchParams, UpdateBranchParams>({
  tableName: "branches",
  selectColumns:
    "id, organization_id, name, address, phone, email, is_main, settings, is_active, created_by, updated_by, created_at, updated_at",
  cacheTagKey: (orgId: string) => cacheTags.branches(orgId),
  orderBy: { column: "created_at", direction: "asc" },
  fieldMap: {
    columns: {
      name: "name",
      address: "address",
      phone: "phone",
      email: "email",
      isMain: "is_main",
      settings: "settings",
    },
    transforms: {
      name: trimField,
    },
  },
  hooks: {
    beforeCreate: async (params) => {
      if (!params.name?.trim()) {
        throw new ValidationError("Branch name is required");
      }
      return {
        name: params.name.trim(),
        address: params.address?.trim() ?? null,
        phone: params.phone?.trim() ?? null,
        email: params.email?.trim() ?? null,
      } as Partial<CreateBranchParams>;
    },
  },
});

// ── Backward-compatible wrappers ──────────────────────────────

/**
 * Creates a new branch for the given organization.
 */
export async function createBranch(
  db: SupabaseClient,
  orgId: string,
  params: CreateBranchParams,
  userId_?: string,
): Promise<Branch> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return crud.create(db, orgId, params, userId);
}

/**
 * Lists all non-deleted branches for an organization.
 */
export async function getBranches(
  db: SupabaseClient,
  orgId: string,
): Promise<Branch[]> {
  const result = await crud.getAll(db, orgId, { pageSize: 1000 });
  return result.data;
}

/**
 * Updates a branch. Verifies the branch belongs to the org.
 */
export async function updateBranch(
  db: SupabaseClient,
  branchId: string,
  orgId: string,
  params: UpdateBranchParams,
  userId_?: string,
): Promise<Branch> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return crud.update(db, orgId, branchId, params, userId);
}

/**
 * Soft-deletes a branch by setting deleted_at.
 */
export async function deleteBranch(
  db: SupabaseClient,
  branchId: string,
  orgId: string,
  userId_?: string,
): Promise<void> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  await crud.softDelete(db, orgId, branchId, userId);
}
