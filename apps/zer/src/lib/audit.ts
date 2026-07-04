"use server";

import { requireAppContext } from "@/lib/erp";
import type { createClient } from "@/lib/supabase/server";
import { capture } from "@zuiio/capture";

type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "shared"
  | "payment_received"
  | "activated"
  | "deactivated";

type EntityType =
  | "product"
  | "sale"
  | "expense"
  | "contact"
  | "invoice"
  | "category"
  | "stock_movement"
  | "warehouse"
  | "brand"
  | "purchase_order"
  | "quotation"
  | "return"
  | "discount"
  | "journal_entry"
  | "account";

type FieldChange = {
  old: unknown;
  new: unknown;
};

/**
 * Log an auditable event. Runs inside a server action context.
 * Uses requireAppContext to get the current user and organization.
 */
export async function logAuditEvent(
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  fieldChanges?: Record<string, FieldChange>,
  summary?: string,
) {
  try {
    const { supabase, organizationId, userId } = await requireAppContext();

    await supabase.from("audit_log").insert({
      organization_id: organizationId,
      actor_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      field_changes: (fieldChanges ?? null) as any,
      summary: summary ?? `${action} ${entityType}`,
    });
  } catch {
    // Audit logging should never break the calling operation
    capture({ action, entityType, entityId }, { context: "audit: log event" });
  }
}

/**
 * Log an auditable event with a provided supabase client (for cases where
 * requireAppContext has already been called).
 */
export async function logAuditEventWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  actorId: string,
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  fieldChanges?: Record<string, FieldChange>,
  summary?: string,
) {
  try {
    await supabase.from("audit_log").insert({
      organization_id: organizationId,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      field_changes: (fieldChanges ?? null) as any,
      summary: summary ?? `${action} ${entityType}`,
    });
  } catch {
    capture({ action, entityType, entityId }, { context: "audit: log event with client" });
  }
}
