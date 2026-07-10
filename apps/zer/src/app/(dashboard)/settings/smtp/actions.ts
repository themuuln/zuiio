"use server";

import { capture } from "@zuiio/capture";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server-service";
import { getSuperadminEmail } from "@/lib/superadmin";

const _SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

async function requireSuperadminAction() {
  const email = await getSuperadminEmail();
  if (!email) redirect("/login");
  return email;
}

export async function addSmtpConfig(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  await requireSuperadminAction();

  const admin = createServiceClient();
  const { error } = await admin.from("smtp_configs").insert({
    host: (formData.get("host") as string) || "smtp.gmail.com",
    port: Number(formData.get("port")) || 587,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    from_email: formData.get("from_email") as string,
    from_name: (formData.get("from_name") as string) || null,
    priority: Number(formData.get("priority")) || 0,
  });

  if (error) {
    capture(error, { context: "smtp: addSmtpConfig" });
    return { error: error.message };
  }

  revalidatePath("/settings/smtp");
  return { success: true };
}

export async function deleteSmtpConfig(configId: string) {
  await requireSuperadminAction();

  const admin = createServiceClient();
  const { error } = await admin
    .from("smtp_configs")
    .delete()
    .eq("id", configId);

  if (error) {
    capture(error, { context: "smtp: deleteSmtpConfig" });
    return { error: error.message };
  }

  revalidatePath("/settings/smtp");
  return { success: true };
}

export async function toggleSmtpConfig(configId: string, isActive: boolean) {
  await requireSuperadminAction();

  const admin = createServiceClient();
  const { error } = await admin
    .from("smtp_configs")
    .update({ is_active: isActive })
    .eq("id", configId);

  if (error) {
    capture(error);
    return { error: error.message };
  }

  revalidatePath("/settings/smtp");
  return { success: true };
}
