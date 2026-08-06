"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { DASHBOARD_TEMPLATES } from "@/lib/dashboard-templates";
import { revalidateEntities } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";

export type DashboardTemplateState = {
  error?: string;
  success?: boolean;
};

/**
 * Apply a dashboard template preset to the organization.
 *
 * Requires `settings.update` permission. The template id is validated
 * against the known preset list before touching the database.
 */
export async function applyDashboardTemplate(
  _prevState: DashboardTemplateState | undefined,
  formData: FormData,
): Promise<DashboardTemplateState> {
  const ctx = await requireWriteAction("settings.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const templateId = formData.get("dashboard_template")?.toString();
  const template = DASHBOARD_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return { error: "Загвар олдсонгүй. Дахин оролдоно уу." };
  }

  const { error } = await withDbCapture(
    "organizations: update dashboard template",
    supabase
      .from("organizations")
      .update({
        dashboard_template: template.id,
      } as Database["public"]["Tables"]["organizations"]["Update"])
      .eq("id", organizationId),
  );

  if (error) {
    capture(error, { context: "applyDashboardTemplate" });
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["settings", "dashboard"]);
  return { success: true };
}
