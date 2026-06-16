"use server";

import { requireAppContext } from "@/lib/erp";
import type { createClient } from "@/lib/supabase/server";

type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "shared"
  | "payment_received";

type EntityType =
  | "product"
  | "sale"
  | "expense"
  | "contact"
  | "invoice"
  | "category"
  | "stock_movement"
  | "warehouse"
  | "brand";

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
      field_changes: fieldChanges ?? null,
      summary: summary ?? `${action} ${entityType}`,
    });
  } catch {
    // Audit logging should never break the calling operation
    console.error("Failed to log audit event:", {
      action,
      entityType,
      entityId,
    });
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
      field_changes: fieldChanges ?? null,
      summary: summary ?? `${action} ${entityType}`,
    });
  } catch {
    console.error("Failed to log audit event:", {
      action,
      entityType,
      entityId,
    });
  }
}
