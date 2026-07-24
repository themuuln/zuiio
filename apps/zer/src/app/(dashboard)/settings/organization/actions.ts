"use server";
import { capture } from "@zuiio/capture";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";

export type OrgSettingsState = {
  error?: string;
  success?: boolean;
};

export async function updateReportEmailSettings(
  _prevState: OrgSettingsState | undefined,
  formData: FormData,
): Promise<OrgSettingsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const enabled = formData.get("report_email_enabled") === "on";
  const time = formData.get("report_email_time") as string;
  const recipient = (formData.get("report_email_recipient") as string) || null;

  if (enabled && !time) {
    return { error: "Цагийг сонгоно уу." };
  }

  // Validate time format (HH:MM)
  if (enabled && !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Цагийн формат буруу байна. (Жишээ: 18:00)" };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      report_email_enabled: enabled,
      report_email_time: enabled ? time : null,
      report_email_recipient: recipient || null,
    })
    .eq("id", organizationId);

  if (updateError) {
    capture(updateError, {
      context: "organization: updateReportEmailSettings",
    });
    return {
      error: `Тохиргоо хадгалахад алдаа гарлаа: ${updateError.message}`,
    };
  }

  revalidateEntity("settings");
  return { success: true };
}

export async function updatePublicProfile(
  _prevState: OrgSettingsState | undefined,
  formData: FormData,
): Promise<OrgSettingsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const catalogEnabled = formData.get("catalog_enabled") === "on";
  const displayName = (formData.get("display_name") as string) || null;
  const description = (formData.get("description") as string) || null;
  const contactEmail = (formData.get("contact_email") as string) || null;
  const contactPhone = (formData.get("contact_phone") as string) || null;
  const address = (formData.get("address") as string) || null;
  const websiteUrl = (formData.get("website_url") as string) || null;

  const result = await supabase
    .from("organization_public_profiles" as never)
    .upsert(
      {
        organization_id: organizationId,
        catalog_enabled: catalogEnabled,
        display_name: displayName,
        description,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        website_url: websiteUrl,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "organization_id" },
    );

  if (result.error) {
    capture(result.error, { context: "updatePublicProfile" });
    return { error: `Хадгалахад алдаа гарлаа: ${result.error.message}` };
  }

  revalidateEntity("settings");
  return { success: true };
}
