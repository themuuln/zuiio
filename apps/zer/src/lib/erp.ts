import { capture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import type { AppPermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type AppContext = Awaited<ReturnType<typeof requireAppContext>>;

/**
 * Returns an error string if the user lacks the required permission.
 * Returns null if the permission is granted.
 */
export function checkPermission(
  permissions: AppPermission[],
  required: AppPermission,
): string | null {
  return permissions.includes(required) ? null : "Танд эрх байхгүй байна.";
}

export async function requireAppContext() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    redirect("/login");
  }
  const claims = data?.claims;
  const userId = claims?.sub;
  if (!userId) {
    redirect("/login");
  }

  // Profile and permissions are independent — run in parallel (~100-200ms saved)
  const [profileResult, permissionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("organization_id, role_id, branch_id")
      .eq("id", userId)
      .single(),
    supabase.rpc("get_user_permissions"),
  ]);

  const { data: profile, error: profileError } = profileResult;
  const { data: permissions, error: permissionsError } = permissionsResult;

  if (profileError || !profile?.organization_id) {
    if (profileError) {
      capture(profileError, {
        context: "erp: requireAppContext profile fetch",
      });
    }
    redirect("/organization/new");
  }

  if (permissionsError) {
    capture(permissionsError, {
      context: "erp: requireAppContext permissions",
    });
  }

  const branchId = profile.branch_id ?? null;

  return {
    supabase,
    organizationId: profile.organization_id,
    user: {
      id: userId,
      email: (claims as Record<string, unknown>).email ?? null,
    },
    userId,
    roleId: profile.role_id,
    permissions: (permissions ?? []) as AppPermission[],
    /** The user's assigned branch ID, or null for org-wide access. */
    branchId,
    /** True when the user is scoped to a single branch (branchId !== null). */
    isBranchScoped: branchId !== null,
  };
}

export function parseAmount(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isValidPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
