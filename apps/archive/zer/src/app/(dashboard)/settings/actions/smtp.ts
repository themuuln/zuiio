"use server";
import { capture, withDbCapture } from "@zuiio/capture";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";

// ─── SMTP Config ──────────────────────────────────────────────────────

export async function saveSmtpConfig(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("emails.manage");
  if ("error" in ctx) return ctx;
  const { supabase } = ctx;

  const host = formData.get("host")?.toString();
  const portStr = formData.get("port")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const from_email = formData.get("from_email")?.toString();
  const from_name = formData.get("from_name")?.toString();

  if (!host || !portStr || !username || !password || !from_email) {
    return { error: "Шаардлагатай талбаруудыг бөглөнө үү." };
  }

  const port = Number.parseInt(portStr, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return { error: "Порт утга буруу байна." };
  }

  // Check if we're updating an existing config or creating a new one
  const configId = formData.get("config_id")?.toString();

  if (configId) {
    const { error } = await withDbCapture(
      "smtp_configs: update",
      supabase
        .from("smtp_configs")
        .update({
          host,
          port,
          username,
          password,
          from_email,
          from_name: from_name || null,
        })
        .eq("id", configId),
    );

    if (error) {
      capture(error, { context: "smtp: upsertSmtpConfig" });
      return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
    }
  } else {
    const { error } = await withDbCapture(
      "smtp_configs: create",
      supabase.from("smtp_configs").insert({
        host,
        port,
        username,
        password,
        from_email,
        from_name: from_name || null,
        is_active: true,
        priority: 0,
      }),
    );

    if (error) {
      capture(error, { context: "smtp: upsertSmtpConfig" });
      return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
    }
  }

  revalidateEntity("settings");
  return { success: true as const };
}

// ─── Report Email Settings ───────────────────────────────────────────

export async function saveReportEmailSettings(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const enabled = formData.get("enabled") === "true";
  const recipient = formData.get("recipient")?.toString() || null;
  const sendTime = formData.get("send_time")?.toString() || "09:00";

  if (enabled && !recipient) {
    return { error: "Хүлээн авагч и-мэйл хаяг шаардлагатай." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      report_email_enabled: enabled,
      report_email_recipient: recipient,
      report_email_time: sendTime,
    })
    .eq("id", organizationId);

  if (error) {
    capture(error, { context: "smtp: deleteSmtpConfig" });
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("settings");
  return { success: true as const };
}
