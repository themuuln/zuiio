import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAppContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    redirect("/organization/new");
  }

  return {
    supabase,
    organizationId: profile.organization_id,
    user,
    userId: user.id,
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
