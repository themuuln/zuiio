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

  // Use getSession() instead of getUser() to avoid a Supabase Auth API roundtrip.
  // The proxy already verified the session via getUser() and set cookies.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role_id, branch_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }
    redirect("/organization/new");
  }

  // Load user permissions
  const { data: permissions } = await supabase.rpc("get_user_permissions");

  const branchId = profile.branch_id ?? null;

  return {
    supabase,
    organizationId: profile.organization_id,
    user,
    userId: user.id,
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
