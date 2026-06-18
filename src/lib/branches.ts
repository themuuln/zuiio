import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Represents a branch with readable fields.
 * Mirrors the `branches` table row shape.
 */
export interface BranchInfo {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
}

/**
 * Returns all branches a user is allowed to see.
 *
 * - Admins/org-wide users (branch_id=NULL on their profile): all branches in their org.
 * - Scoped users (branch_id set): only their assigned branch.
 */
export async function getUserBranches(userId: string): Promise<BranchInfo[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", userId)
    .single();

  if (!profile?.organization_id) return [];

  if (profile.branch_id) {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("id", profile.branch_id)
      .eq("organization_id", profile.organization_id);

    return (data ?? []) as BranchInfo[];
  }

  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("name");

  return (data ?? []) as BranchInfo[];
}

/**
 * Returns the branches accessible to a user within a given organization.
 * Useful when the caller already knows the organization ID.
 *
 * - Org-wide user → all branches in the organization.
 * - Scoped user   → only the single assigned branch.
 */
export async function getAccessibleBranches(
  organizationId: string,
  userId: string,
): Promise<BranchInfo[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (!profile) return [];

  if (profile.branch_id) {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("id", profile.branch_id)
      .eq("organization_id", organizationId);

    return (data ?? []) as BranchInfo[];
  }

  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  return (data ?? []) as BranchInfo[];
}

/**
 * Apply a branch filter to a Supabase query when the user is branch-scoped.
 *
 * Usage:
 * ```ts
 * let query = supabase.from("sales").select("*");
 * query = withBranchFilter(query, branchId, isBranchScoped);
 * ```
 */
export function withBranchFilter<
  T extends { eq: (k: string, v: unknown) => T },
>(query: T, branchId: string | null, isBranchScoped: boolean): T {
  if (isBranchScoped && branchId) {
    return query.eq("branch_id", branchId);
  }
  return query;
}

/**
 * Enforces that the user can access a specific record's branch.
 *
 * If the user is branch-scoped and the record's branch_id does not match
 * the user's branch, redirects to 404 (not-found) to avoid information
 * leaking about the existence of records in other branches.
 *
 * Returns the validated record if access is allowed.
 *
 * Usage:
 * ```ts
 * const { supabase, branchId, isBranchScoped, organizationId } = await requireAppContext();
 * const record = await fetchRecord(...);
 * enforceBranchAccess(record, branchId, isBranchScoped);
 * ```
 */
export function enforceBranchAccess<T extends { branch_id?: string | null }>(
  record: T | null,
  branchId: string | null,
  isBranchScoped: boolean,
): T {
  if (!record) {
    redirect("/not-found");
  }

  if (isBranchScoped && branchId && record.branch_id !== branchId) {
    redirect("/not-found");
  }

  return record;
}

/**
 * Checks whether the user can access the given branch based on
 * their profile branch scope. Returns true if the user is org-wide
 * or if the requested branch matches their assigned branch.
 */
export function canAccessBranch(
  userBranchId: string | null,
  targetBranchId: string | null,
): boolean {
  if (!userBranchId) return true; // org-wide → can access any branch
  return userBranchId === targetBranchId;
}
