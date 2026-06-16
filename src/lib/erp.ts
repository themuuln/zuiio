import { redirect } from "next/navigation";
import type { AppPermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type AppContext = Awaited<ReturnType<typeof requireAppContext>>;

export async function requireAppContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role_id")
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

  return {
    supabase,
    organizationId: profile.organization_id,
    user,
    userId: user.id,
    roleId: profile.role_id,
    permissions: (permissions ?? []) as AppPermission[],
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
