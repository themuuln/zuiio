import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

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
 * let query = supabase.from("sales").select("id,total_amount");
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
