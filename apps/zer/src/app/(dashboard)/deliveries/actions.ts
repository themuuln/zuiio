"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireActionContext, requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type DeliveryRow = {
  id: string;
  sale_id: string;
  branch_id: string;
  address: string | null;
  contact_name: string;
  contact_phone: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  delivery_fee: number;
  notes: string | null;
  requested_at: string | null;
  estimated_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
  sale_total: number | null;
  sale_contact_name: string | null;
};

export type DeliveryDetailData = {
  id: string;
  sale_id: string;
  address: string | null;
  address_note: string | null;
  contact_name: string;
  contact_phone: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  delivery_fee: number;
  notes: string | null;
  courier_notes: string | null;
  external_tracking_id: string | null;
  external_tracking_url: string | null;
  requested_at: string | null;
  estimated_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  zone_name: string | null;
  provider_name: string | null;
  sale_total: number | null;
  sale_contact_name: string | null;
  status_history: Array<{
    status: string;
    changed_by: string | null;
    changed_name: string | null;
    notes: string | null;
    created_at: string | null;
  }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFloatSafe(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ---------------------------------------------------------------------------
// createDelivery
// ---------------------------------------------------------------------------

export async function createDelivery(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("sales.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const saleId = getString(formData, "sale_id");
  const providerId = getString(formData, "provider_id") || null;
  const zoneId = getString(formData, "zone_id") || null;
  const address = getString(formData, "address") || null;
  const addressNote = getString(formData, "address_note") || null;
  const contactName = getString(formData, "contact_name");
  const contactPhone = getString(formData, "contact_phone");
  const deliveryFee = parseFloatSafe(formData.get("delivery_fee"));
  const requestedAt = getString(formData, "requested_at") || null;
  const estimatedAt = getString(formData, "estimated_at") || null;
  const notes = getString(formData, "notes") || null;

  // Validation
  if (!saleId) {
    return { error: "Борлуулалт шаардлагатай." };
  }
  if (!contactName) {
    return { error: "Холбогдох хүний нэр шаардлагатай." };
  }
  if (!contactPhone) {
    return { error: "Утасны дугаар шаардлагатай." };
  }

  // Insert delivery record
  const { data: delivery, error: insertError } = await withDbCapture(
    "deliveries: create",
    supabase
      .from("deliveries")
      .insert({
        organization_id: organizationId,
        sale_id: saleId,
        branch_id: branchId,
        provider_id: providerId,
        zone_id: zoneId,
        address,
        address_note: addressNote,
        contact_name: contactName,
        contact_phone: contactPhone,
        delivery_fee: deliveryFee,
        requested_at: requestedAt,
        estimated_at: estimatedAt,
        notes,
        status: "pending",
      })
      .select("id")
      .single(),
  );

  if (insertError) {
    return {
      error: `Хүргэлт үүсгэхэд алдаа гарлаа: ${insertError.message}`,
    };
  }

  // If external provider, dispatch via provider adapter
  if (providerId) {
    try {
      const { data: provider } = await withDbCapture(
        "deliveries: fetch provider config",
        supabase
          .from("delivery_providers")
          .select("provider_type, api_key, api_secret")
          .eq("id", providerId)
          .single(),
      );

      if (provider && provider.provider_type !== "internal") {
        const { getProvider } = await import("@/lib/delivery/providers");
        const deliveryProvider = getProvider({
          providerType: provider.provider_type,
          apiKey: provider.api_key || undefined,
          apiSecret: provider.api_secret || undefined,
        });

        const result = await deliveryProvider.createDelivery({
          pickupAddress: "", // Will be filled from branch address
          pickupContact: "Zer",
          pickupPhone: "",
          dropoffAddress: address || "",
          dropoffContact: contactName,
          dropoffPhone: contactPhone,
          notes: notes || undefined,
        });

        // Update delivery record with external tracking info
        await withDbCapture(
          "deliveries: update external tracking",
          supabase
            .from("deliveries")
            .update({
              external_tracking_id: result.externalId,
              external_tracking_url: result.trackingUrl,
              delivery_fee: result.estimatedFee,
              estimated_at: new Date(
                Date.now() + result.estimatedMinutes * 60 * 1000,
              ).toISOString(),
            })
            .eq("id", delivery.id),
        );
      }
    } catch (e) {
      capture(e, { context: "deliveries: external provider dispatch" });
      // Don't fail — delivery created in DB even if external dispatch fails
    }
  }

  // Insert initial status history
  const { error: historyError } = await withDbCapture(
    "deliveries: insert initial status history",
    supabase.from("delivery_status_history").insert({
      delivery_id: delivery.id,
      status: "pending",
      changed_by: userId,
      notes: "Хүргэлт үүсгэсэн",
    }),
  );

  if (historyError) {
    capture(historyError, { context: "deliveries: initial status history" });
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "delivery",
      delivery.id,
      undefined,
      `Хүргэлт "${contactName}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["deliveries"]);
  return { success: true as const, error: undefined };
}

// ---------------------------------------------------------------------------
// updateDeliveryStatus
// ---------------------------------------------------------------------------

export async function updateDeliveryStatus(
  deliveryId: string,
  status: string,
  notes?: string,
) {
  const ctx = await requireWriteAction("sales.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Verify org access and fetch current status
  const { data: delivery, error: fetchError } = await withDbCapture(
    "deliveries: fetch for status update",
    supabase
      .from("deliveries")
      .select("status, contact_name")
      .eq("id", deliveryId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !delivery) {
    return { error: "Хүргэлт олдсонгүй." };
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    pending: ["assigned", "cancelled"],
    assigned: ["picked_up", "cancelled"],
    picked_up: ["in_transit"],
    in_transit: ["delivered", "failed"],
    failed: ["pending"],
  };

  const allowed = validTransitions[delivery.status];
  if (!allowed?.includes(status)) {
    return {
      error: `"${delivery.status}" статусаас "${status}" руу шилжүүлэх боломжгүй.`,
    };
  }

  // Build update payload — set timestamps on terminal/signpost transitions
  const updatePayload: {
    status: string;
    delivered_at?: string | null;
    picked_up_at?: string | null;
  } = { status };
  if (status === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }
  if (status === "picked_up") {
    updatePayload.picked_up_at = new Date().toISOString();
  }

  const { error: updateError } = await withDbCapture(
    "deliveries: update status",
    supabase
      .from("deliveries")
      .update(updatePayload)
      .eq("id", deliveryId)
      .eq("organization_id", organizationId),
  );

  if (updateError) {
    return {
      error: `Статус шинэчлэхэд алдаа гарлаа: ${updateError.message}`,
    };
  }

  // Insert status history entry
  const { error: historyError } = await withDbCapture(
    "deliveries: insert status history",
    supabase.from("delivery_status_history").insert({
      delivery_id: deliveryId,
      status,
      changed_by: userId,
      notes: notes ?? null,
    }),
  );

  if (historyError) {
    capture(historyError, { context: "deliveries: status history insert" });
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "delivery",
      deliveryId,
      { status: { old: delivery.status, new: status } },
      `Хүргэлт "${delivery.contact_name}" статус "${status}" болсон`,
    ),
  );

  // Fire-and-forget notification
  import("@/lib/notification").then(({ notifyDeliveryStatus }) =>
    notifyDeliveryStatus(organizationId, delivery.contact_name, status),
  );

  revalidateEntities(["deliveries"]);
  return { success: true as const, error: undefined };
}

// ---------------------------------------------------------------------------
// assignDelivery
// ---------------------------------------------------------------------------

export async function assignDelivery(deliveryId: string, assignedTo: string) {
  const ctx = await requireWriteAction("sales.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Verify org access and current status
  const { data: delivery, error: fetchError } = await withDbCapture(
    "deliveries: fetch for assign",
    supabase
      .from("deliveries")
      .select("status, contact_name")
      .eq("id", deliveryId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !delivery) {
    return { error: "Хүргэлт олдсонгүй." };
  }

  if (delivery.status !== "pending") {
    return {
      error: "Зөвхөн 'pending' статустай хүргэлтийг курьерт оноох боломжтой.",
    };
  }

  // Update assigned_to and transition status to assigned
  const { error: updateError } = await withDbCapture(
    "deliveries: assign courier",
    supabase
      .from("deliveries")
      .update({ assigned_to: assignedTo, status: "assigned" })
      .eq("id", deliveryId)
      .eq("organization_id", organizationId),
  );

  if (updateError) {
    return {
      error: `Курьер онооход алдаа гарлаа: ${updateError.message}`,
    };
  }

  // Insert status history
  const { error: historyError } = await withDbCapture(
    "deliveries: insert assign history",
    supabase.from("delivery_status_history").insert({
      delivery_id: deliveryId,
      status: "assigned",
      changed_by: userId,
      notes: `Курьер оноогдсон`,
    }),
  );

  if (historyError) {
    capture(historyError, { context: "deliveries: assign history" });
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "assigned",
      "delivery",
      deliveryId,
      { assigned_to: { old: null, new: assignedTo } },
      `Хүргэлт "${delivery.contact_name}" курьерт оноосон`,
    ),
  );

  revalidateEntities(["deliveries"]);
  return { success: true as const, error: undefined };
}

// ---------------------------------------------------------------------------
// listDeliveries
// ---------------------------------------------------------------------------

export async function listDeliveries(
  statusFilter?: string,
): Promise<DeliveryRow[]> {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return [];
  const { supabase, organizationId, branchId, isBranchScoped } = ctx;

  let query = supabase
    .from("deliveries")
    .select(
      `id, sale_id, branch_id, address, contact_name, contact_phone, status, assigned_to, delivery_fee, notes, requested_at, estimated_at, delivered_at, created_at,
      sales!inner(id, total_amount, contacts(name)),
      profiles!deliveries_assigned_to_fkey(full_name)`,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (isBranchScoped && branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await withDbCapture("deliveries: list", query);

  if (error || !data) {
    capture(error, { context: "deliveries: list" });
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    sale_id: d.sale_id,
    branch_id: d.branch_id,
    address: (d.address as string | null) ?? null,
    contact_name: d.contact_name as string,
    contact_phone: d.contact_phone as string,
    status: d.status as string,
    assigned_to: (d.assigned_to as string | null) ?? null,
    assigned_name:
      ((d.profiles as { full_name: string | null } | null)?.full_name as
        | string
        | null) ?? null,
    delivery_fee: d.delivery_fee as number,
    notes: (d.notes as string | null) ?? null,
    requested_at: (d.requested_at as string | null) ?? null,
    estimated_at: (d.estimated_at as string | null) ?? null,
    delivered_at: (d.delivered_at as string | null) ?? null,
    created_at: (d.created_at as string | null) ?? null,
    sale_total:
      ((d.sales as { total_amount: number } | null)?.total_amount as
        | number
        | null) ?? null,
    sale_contact_name:
      (
        (d.sales as { contacts: { name: string } | null } | null)?.contacts as {
          name: string;
        } | null
      )?.name ?? null,
  }));
}

// ---------------------------------------------------------------------------
// getDeliveryDetail
// ---------------------------------------------------------------------------

export async function getDeliveryDetail(
  deliveryId: string,
): Promise<DeliveryDetailData | null> {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return null;
  const { supabase, organizationId } = ctx;

  const { data: delivery, error } = await withDbCapture(
    "deliveries: detail",
    supabase
      .from("deliveries")
      .select(
        `id, sale_id, address, address_note, contact_name, contact_phone, status, assigned_to, delivery_fee, notes, courier_notes, external_tracking_id, external_tracking_url, requested_at, estimated_at, picked_up_at, delivered_at,
        sales!inner(id, total_amount, contacts(name)),
        profiles!deliveries_assigned_to_fkey(full_name),
        delivery_zones(name),
        delivery_providers(name)`,
      )
      .eq("id", deliveryId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (error || !delivery) {
    capture(error, { context: "deliveries: detail" });
    return null;
  }

  // Fetch status history with changer names
  const { data: history } = await withDbCapture(
    "deliveries: detail history",
    supabase
      .from("delivery_status_history")
      .select(
        `status, changed_by, notes, created_at,
        profiles!delivery_status_history_changed_by_fkey(full_name)`,
      )
      .eq("delivery_id", deliveryId)
      .order("created_at", { ascending: true }),
  );

  return {
    id: delivery.id as string,
    sale_id: delivery.sale_id as string,
    address: (delivery.address as string | null) ?? null,
    address_note: (delivery.address_note as string | null) ?? null,
    contact_name: delivery.contact_name as string,
    contact_phone: delivery.contact_phone as string,
    status: delivery.status as string,
    assigned_to: (delivery.assigned_to as string | null) ?? null,
    assigned_name:
      ((delivery.profiles as { full_name: string | null } | null)?.full_name as
        | string
        | null) ?? null,
    delivery_fee: delivery.delivery_fee as number,
    notes: (delivery.notes as string | null) ?? null,
    courier_notes: (delivery.courier_notes as string | null) ?? null,
    external_tracking_id:
      (delivery.external_tracking_id as string | null) ?? null,
    external_tracking_url:
      (delivery.external_tracking_url as string | null) ?? null,
    requested_at: (delivery.requested_at as string | null) ?? null,
    estimated_at: (delivery.estimated_at as string | null) ?? null,
    picked_up_at: (delivery.picked_up_at as string | null) ?? null,
    delivered_at: (delivery.delivered_at as string | null) ?? null,
    zone_name:
      ((delivery.delivery_zones as { name: string } | null)?.name as
        | string
        | null) ?? null,
    provider_name:
      ((delivery.delivery_providers as { name: string } | null)?.name as
        | string
        | null) ?? null,
    sale_total:
      ((delivery.sales as { total_amount: number } | null)?.total_amount as
        | number
        | null) ?? null,
    sale_contact_name:
      (
        (delivery.sales as { contacts: { name: string } | null } | null)
          ?.contacts as { name: string } | null
      )?.name ?? null,
    status_history: (history ?? []).map((h) => ({
      status: h.status as string,
      changed_by: (h.changed_by as string | null) ?? null,
      changed_name:
        ((h.profiles as { full_name: string | null } | null)?.full_name as
          | string
          | null) ?? null,
      notes: (h.notes as string | null) ?? null,
      created_at: (h.created_at as string | null) ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// listDeliveryZones
// ---------------------------------------------------------------------------

export async function listDeliveryZones(orgId: string) {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return [];
  const { supabase } = ctx;

  const { data, error } = await withDbCapture(
    "deliveries: list zones",
    supabase
      .from("delivery_zones")
      .select(
        "id, name, base_fee, description, estimated_delivery_minutes, is_active, sort_order",
      )
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error || !data) {
    capture(error, { context: "deliveries: list zones" });
    return [];
  }

  return data;
}

// ---------------------------------------------------------------------------
// listDeliveryProviders
// ---------------------------------------------------------------------------

export async function listDeliveryProviders(orgId: string) {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return [];
  const { supabase } = ctx;

  const { data, error } = await withDbCapture(
    "deliveries: list providers",
    supabase
      .from("delivery_providers")
      .select("id, name, provider_type, is_active")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  );

  if (error || !data) {
    capture(error, { context: "deliveries: list providers" });
    return [];
  }

  return data;
}
