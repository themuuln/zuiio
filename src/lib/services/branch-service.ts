import type { Branch } from "@/lib/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { CreateBranchParams, UpdateBranchParams } from "@/lib/types";

/**
 * Creates a new branch for the given organization.
 */
export async function createBranch(
  orgId: string,
  params: CreateBranchParams,
): Promise<Branch> {
  if (!params.name?.trim())
    throw new ValidationError("Branch name is required");

  const supabase = await createClient();
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
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create branch");
  }

  return data;
}

/**
 * Lists all non-deleted branches for an organization.
 */
export async function getBranches(orgId: string): Promise<Branch[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch branches");
  }

  return data ?? [];
}

/**
 * Updates a branch. Verifies the branch belongs to the org.
 */
export async function updateBranch(
  branchId: string,
  orgId: string,
  params: UpdateBranchParams,
): Promise<Branch> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.address !== undefined) updates.address = params.address;
  if (params.phone !== undefined) updates.phone = params.phone;
  if (params.email !== undefined) updates.email = params.email;
  if (params.isMain !== undefined) updates.is_main = params.isMain;
  if (params.settings !== undefined) updates.settings = params.settings;
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
    .select("*")
    .single();

  if (error || !data) {
    throw new NotFoundError("Branch not found");
  }

  return data;
}

/**
 * Soft-deletes a branch by setting deleted_at.
 */
export async function deleteBranch(
  branchId: string,
  orgId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", branchId)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw new NotFoundError("Branch not found or already deleted");
  }
}
