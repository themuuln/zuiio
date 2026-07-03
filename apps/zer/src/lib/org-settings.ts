import "server-only";
import type { createClient } from "@/lib/supabase/server";

/** Known org-setting boolean column names that are safe to pass to .select(). */
const ALLOWED_SETTINGS = new Set([
  "has_suppliers",
  "has_inventory",
  "has_customer_credit",
  "has_multi_branch",
  "has_variants",
  "has_brands",
  "has_categories",
  "has_email_reports",
  "has_audit_log",
  "onboarding_completed",
]);

/**
 * Check an organization boolean setting from a server component.
 * Returns `true` if the setting is not explicitly false.
 *
 * Usage:
 * ```ts
 * const { supabase, organizationId } = await requireAppContext();
 * if (!await checkOrgSetting(supabase, organizationId, "has_inventory")) redirect("/");
 * ```
 */
export async function checkOrgSetting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  setting: string,
): Promise<boolean> {
  if (!ALLOWED_SETTINGS.has(setting)) {
    throw new Error(`Invalid org setting column: "${setting}"`);
  }

  const { data, error } = await supabase
    .from("organizations")
    .select(setting)
    .eq("id", organizationId)
    .single();

  if (error) {
    // Query failure (e.g. a column doesn't exist) must NOT silently enable features.
    // Log the error and deny the check — the feature will be hidden from the user.
    console.error("[org-settings] Query failed", {
      setting,
      organizationId,
      error,
    });
    return false;
  }

  return (
    (data as unknown as Record<string, boolean | null> | null)?.[setting] !==
    false
  );
}
