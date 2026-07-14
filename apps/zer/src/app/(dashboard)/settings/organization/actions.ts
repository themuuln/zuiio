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
