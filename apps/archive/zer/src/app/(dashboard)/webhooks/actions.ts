"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";
import { WEBHOOK_EVENT_TYPES, type WebhookEventType } from "@/lib/webhooks";

function parseEventTypes(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (WEBHOOK_EVENT_TYPES as readonly string[]).includes(s));
}

function validateUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "URL нь http/https байх ёстой.";
    }
    return null;
  } catch {
    return "URL буруу байна.";
  }
}

// ─── Create ────────────────────────────────────────────────────────

export async function createWebhook(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("webhooks.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const name = getString(formData, "name");
  const url = getString(formData, "url");
  const secret = getString(formData, "secret");
  const eventTypes = parseEventTypes(formData.get("event_types"));
  const isActive = formData.get("is_active") === "true";

  if (!name) return { error: "Нэр шаардлагатай." };
  if (!url) return { error: "URL шаардлагатай." };
  const urlError = validateUrl(url);
  if (urlError) return { error: urlError };
  if (eventTypes.length === 0) {
    return { error: "Дор хаяж нэг үйл явдал сонгоно уу." };
  }

  const { data: webhook, error: dbError } = await withDbCapture(
    "webhooks: create",
    supabase
      .from("webhook_subscriptions")
      .insert({
        organization_id: organizationId,
        name,
        url,
        secret: secret || null,
        event_types: eventTypes,
        is_active: isActive,
      })
      .select("id")
      .single(),
  );

  if (dbError) {
    capture(dbError, { context: "createWebhook: insert" });
    return { error: `Вебхук үүсгэхэд алдаа гарлаа: ${dbError.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "webhook",
      webhook.id,
      undefined,
      `Вебхук "${name}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["webhooks"]);
  return { success: true as const, error: undefined };
}

// ─── Update ────────────────────────────────────────────────────────

export async function updateWebhook(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("webhooks.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const webhookId = getString(formData, "id");
  if (!webhookId) return { error: "Вебхукийн ID олдсонгүй." };

  const name = getString(formData, "name");
  const url = getString(formData, "url");
  const secret = getString(formData, "secret");
  const eventTypes = parseEventTypes(formData.get("event_types"));
  const isActive = formData.get("is_active") === "true";

  if (!name) return { error: "Нэр шаардлагатай." };
  if (!url) return { error: "URL шаардлагатай." };
  const urlError = validateUrl(url);
  if (urlError) return { error: urlError };
  if (eventTypes.length === 0) {
    return { error: "Дор хаяж нэг үйл явдал сонгоно уу." };
  }

  const { data: existing, error: fetchError } = await withDbCapture(
    "webhooks: fetch for update",
    supabase
      .from("webhook_subscriptions")
      .select("name")
      .eq("id", webhookId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !existing) {
    return { error: "Вебхук олдсонгүй." };
  }

  const { error: dbError } = await withDbCapture(
    "webhooks: update",
    supabase
      .from("webhook_subscriptions")
      .update({
        name,
        url,
        secret: secret || null,
        event_types: eventTypes,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookId)
      .eq("organization_id", organizationId),
  );

  if (dbError) {
    capture(dbError, { context: "updateWebhook: update" });
    return { error: `Вебхук шинэчлэхэд алдаа гарлаа: ${dbError.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "webhook",
      webhookId,
      undefined,
      `Вебхук "${name}" шинэчилсэн`,
    ),
  );

  revalidateEntities(["webhooks"]);
  return { success: true as const, error: undefined };
}

// ─── Toggle active ─────────────────────────────────────────────────

export async function toggleWebhookActive(
  webhookId: string,
  isActive: boolean,
) {
  const ctx = await requireWriteAction("webhooks.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: webhook, error: fetchError } = await withDbCapture(
    "webhooks: fetch for toggle",
    supabase
      .from("webhook_subscriptions")
      .select("name")
      .eq("id", webhookId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !webhook) {
    return { error: "Вебхук олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "webhooks: toggle active",
    supabase
      .from("webhook_subscriptions")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "toggleWebhookActive: update" });
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  const action = isActive ? "Идэвхжүүлсэн" : "Идэвхгүйжүүлсэн";

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      isActive ? "activated" : "deactivated",
      "webhook",
      webhookId,
      { is_active: { old: !isActive, new: isActive } },
      `Вебхук "${webhook.name}" ${action}`,
    ),
  );

  revalidateEntities(["webhooks"]);
  return { success: true as const, error: undefined };
}

// ─── Delete ────────────────────────────────────────────────────────

export async function deleteWebhook(webhookId: string) {
  const ctx = await requireWriteAction("webhooks.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: webhook, error: fetchError } = await withDbCapture(
    "webhooks: fetch for delete",
    supabase
      .from("webhook_subscriptions")
      .select("name")
      .eq("id", webhookId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !webhook) {
    return { error: "Вебхук олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "webhooks: delete",
    supabase
      .from("webhook_subscriptions")
      .delete()
      .eq("id", webhookId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteWebhook: delete" });
    return { error: `Вебхук устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "webhook",
      webhookId,
      undefined,
      `Вебхук "${webhook.name}" устгасан`,
    ),
  );

  revalidateEntities(["webhooks"]);
  return { success: true as const, error: undefined };
}

export type { WebhookEventType };
