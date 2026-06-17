"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSuperadminEmail } from "@/lib/superadmin";

export type OrgSettingsState = {
  error?: string;
  success?: boolean;
};

export async function updateReportEmailSettings(
  _prevState: OrgSettingsState | undefined,
  formData: FormData,
): Promise<OrgSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only superadmin (developer) can change report email settings
  if (!(await getSuperadminEmail())) {
    return { error: "Зөвхөн хөгжүүлэгч энэ тохиргоог өөрчлөх боломжтой." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "Байгууллага олдсонгүй." };
  }

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
    .eq("id", profile.organization_id);

  if (updateError) {
    return {
      error: `Тохиргоо хадгалахад алдаа гарлаа: ${updateError.message}`,
    };
  }

  revalidatePath("/settings/organization");
  return { success: true };
}
