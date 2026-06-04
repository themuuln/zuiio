import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  Branch,
  CreateBranchParams,
  UpdateBranchParams,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

/**
 * Creates a new branch for the given organization.
 */
export async function createBranch(
  db: SupabaseClient,
  orgId: string,
  params: CreateBranchParams,
): Promise<Branch> {
  if (!params.name?.trim())
    throw new ValidationError("Branch name is required");

  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("branches")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      address: params.address?.trim() ?? null,
      phone: params.phone?.trim() ?? null,
      email: params.email?.trim() ?? null,
      is_main: false,
      settings: {},
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, name, address, phone, email, is_main, settings, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create branch");
  }

  revalidateTag(cacheTags.branches(orgId), "max");

  return data as unknown as Branch;
}

/**
 * Lists all non-deleted branches for an organization.
 */
export async function getBranches(
  db: SupabaseClient,
  orgId: string,
): Promise<Branch[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("branches")
    .select(
      "id, organization_id, name, address, phone, email, is_main, settings, is_active, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch branches");
  }

  return (data ?? []) as unknown as Branch[];
}

/**
 * Updates a branch. Verifies the branch belongs to the org.
 */
export async function updateBranch(
  db: SupabaseClient,
  branchId: string,
  orgId: string,
  params: UpdateBranchParams,
): Promise<Branch> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const fieldMap: FieldMap<UpdateBranchParams> = {
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
  };

  const updates = buildUpdates(params, fieldMap);
  updates.updated_by = userId;

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("branches")
    .update(updates)
    .eq("id", branchId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, name, address, phone, email, is_main, settings, is_active, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new NotFoundError("Branch not found");
  }

  revalidateTag(cacheTags.branches(orgId), "max");

  return data as unknown as Branch;
}

/**
 * Soft-deletes a branch by setting deleted_at.
 */
export async function deleteBranch(
  db: SupabaseClient,
  branchId: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", branchId)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw new NotFoundError("Branch not found or already deleted");
  }

  revalidateTag(cacheTags.branches(orgId), "max");
}
