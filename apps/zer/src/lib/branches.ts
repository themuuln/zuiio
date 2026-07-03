import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { capture } from "@zuiio/capture";

export type BranchRow = Database["public"]["Tables"]["branches"]["Row"];

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("[branches] Profile query failed for branch access", {
      userId,
      error: profileError,
    });
  }

  if (!profile?.organization_id) return [];

  if (profile.branch_id) {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("id", profile.branch_id)
      .eq("organization_id", profile.organization_id);
    if (error) capture(error, { context: "[branches] getUserBranches scoped query" });

    return (data ?? []) as BranchInfo[];
  }

  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("name");
  if (error) capture(error, { context: "[branches] getUserBranches org-wide query" });

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
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("id", profile.branch_id)
      .eq("organization_id", organizationId);
    if (error) capture(error, { context: "[branches] getAccessibleBranches scoped query" });

    return (data ?? []) as BranchInfo[];
  }

  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) capture(error, { context: "[branches] getAccessibleBranches org-wide query" });

  return (data ?? []) as BranchInfo[];
}

/**
 * Resolve the effective branch ID to use for filtering.
 *
 * - Scoped users: always use their assigned branch (context.branchId)
 * - Admin users (isBranchScoped=false): use the URL-selected branch if set,
 *   otherwise return null (show all branches)
 */
export function getEffectiveBranchId(
  contextBranchId: string | null,
  isBranchScoped: boolean,
  selectedBranchId: string | null,
): string | null {
  if (isBranchScoped) return contextBranchId;
  return selectedBranchId ?? null;
}

/**
 * Apply a branch filter to a Supabase query.
 *
 * - Scoped users: always filtered by their assigned branch.
 * - Admin users: filtered by the optional `selectedBranchId` (e.g., from URL search params).
 *
 * Usage:
 * ```ts
 * let query = supabase.from("sales").select("*");
 * query = withBranchFilter(query, branchId, isBranchScoped, searchParamsBranch);
 * ```
 */
export function withBranchFilter<T>(
  query: T,
  branchId: string | null,
  isBranchScoped: boolean,
  /** Optional override from URL search params (admin branch selector). */
  selectedBranchId?: string | null,
): T {
  const effectiveBranchId = getEffectiveBranchId(
    branchId,
    isBranchScoped,
    selectedBranchId ?? null,
  );
  if (effectiveBranchId) {
    return (query as { eq: (k: string, v: unknown) => T }).eq(
      "branch_id",
      effectiveBranchId,
    );
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
