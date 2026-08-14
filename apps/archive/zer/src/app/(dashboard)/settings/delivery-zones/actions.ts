"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

function parseFloatSafe(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseIntSafe(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export type ZoneRow = {
  id: string;
  name: string;
  description: string | null;
  base_fee: number;
  free_delivery_threshold: number | null;
  estimated_delivery_minutes: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

// ---------------------------------------------------------------------------
// listZones
// ---------------------------------------------------------------------------

export async function listZones(): Promise<ZoneRow[]> {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return [];
  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "delivery-zones: list",
    supabase
      .from("delivery_zones")
      .select(
        "id, name, description, base_fee, free_delivery_threshold, estimated_delivery_minutes, is_active, sort_order, created_at",
      )
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error) {
    capture(error, { context: "delivery-zones: list" });
    return [];
  }

  return (data ?? []) as ZoneRow[];
}

// ---------------------------------------------------------------------------
// createZone
// ---------------------------------------------------------------------------

export async function createZone(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const baseFee = parseFloatSafe(formData.get("base_fee"));
  const freeDeliveryThreshold = formData.get("free_delivery_threshold");
  const freeDeliveryThresholdValue =
    freeDeliveryThreshold != null && freeDeliveryThreshold !== ""
      ? parseFloatSafe(freeDeliveryThreshold)
      : null;
  const estimatedMinutes = parseIntSafe(
    formData.get("estimated_delivery_minutes"),
  );

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (baseFee < 0) {
    return { error: "Санхүүжилт 0-ээс бага байх боломжгүй." };
  }

  const { data: zone, error } = await withDbCapture(
    "delivery-zones: create",
    supabase
      .from("delivery_zones")
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        base_fee: baseFee,
        free_delivery_threshold: freeDeliveryThresholdValue,
        estimated_delivery_minutes: estimatedMinutes,
      })
      .select("id")
      .single(),
  );

  if (error) {
    return { error: `Бүс үүсгэхэд алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "delivery_zone",
      zone.id,
      undefined,
      `Хүргэлтийн бүс "${name}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["deliveries", "settings"]);
  return { success: true as const, error: undefined };
}

// ---------------------------------------------------------------------------
// updateZone
// ---------------------------------------------------------------------------

export async function updateZone(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const id = getString(formData, "id");
  if (!id) {
    return { error: "Бүсийн ID олдсонгүй." };
  }

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const baseFee = parseFloatSafe(formData.get("base_fee"));
  const freeDeliveryThreshold = formData.get("free_delivery_threshold");
  const freeDeliveryThresholdValue =
    freeDeliveryThreshold != null && freeDeliveryThreshold !== ""
      ? parseFloatSafe(freeDeliveryThreshold)
      : null;
  const estimatedMinutes = parseIntSafe(
    formData.get("estimated_delivery_minutes"),
  );
  const isActive = formData.get("is_active") === "true";

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (baseFee < 0) {
    return { error: "Санхүүжилт 0-ээс бага байх боломжгүй." };
  }

  const { error } = await withDbCapture(
    "delivery-zones: update",
    supabase
      .from("delivery_zones")
      .update({
        name,
        description: description || null,
        base_fee: baseFee,
        free_delivery_threshold: freeDeliveryThresholdValue,
        estimated_delivery_minutes: estimatedMinutes,
        is_active: isActive,
      })
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    return { error: `Бүс засахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "delivery_zone",
      id,
      undefined,
      `Хүргэлтийн бүс "${name}" засагдсан`,
    ),
  );

  revalidateEntities(["deliveries", "settings"]);
  return { success: true as const, error: undefined };
}

// ---------------------------------------------------------------------------
// deleteZone
// ---------------------------------------------------------------------------

export async function deleteZone(id: string) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Fetch the zone name for audit
  const { data: zone } = await withDbCapture(
    "delivery-zones: fetch for delete",
    supabase
      .from("delivery_zones")
      .select("name")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (!zone) {
    return { error: "Бүс олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "delivery-zones: delete",
    supabase
      .from("delivery_zones")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    return { error: `Бүс устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "delivery_zone",
      id,
      undefined,
      `Хүргэлтийн бүс "${zone.name}" устгасан`,
    ),
  );

  revalidateEntities(["deliveries", "settings"]);
  return { success: true as const, error: undefined };
}
