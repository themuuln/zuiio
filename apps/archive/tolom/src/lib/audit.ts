import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";
import type { AuditLogInsert, Database, Json } from "@/lib/types";

/**
 * Parameters for creating an audit log entry.
 */
export interface CreateAuditLogParams {
  /** The Supabase client (server or browser, typed with Database) */
  supabase: SupabaseClient<Database>;
  /** The action performed (e.g. 'create', 'update', 'soft_delete') */
  action: string;
  /** The table name where the action occurred */
  table_name: string;
  /** The ID of the record that was acted upon */
  record_id: string;
  /** The user performing the action. If omitted, derived from auth session. */
  user_id?: string;
  /** The organization ID. If omitted, derived from get_user_organization_id(). */
  organization_id?: string;
  /** Optional branch ID for branch-scoped actions */
  branch_id?: string;
  /** The previous state of the record (for updates/deletes) */
  old_data?: Record<string, unknown>;
  /** The new state of the record (for creates/updates) */
  new_data?: Record<string, unknown>;
}

/**
 * Result of an audit log insertion.
 */
export interface CreateAuditLogResult {
  /** Whether the audit entry was created successfully */
  success: boolean;
  /** The created audit log ID, or null on failure */
  id: string | null;
  /** Error message if the operation failed */
  error: string | null;
}

/**
 * Creates an audit log entry in the audit_logs table.
 *
 * Usage:
 * ```ts
 * await createAuditLog({
 *   supabase,
 *   action: 'update',
 *   table_name: 'work_orders',
 *   record_id: workOrderId,
 *   old_data: previousState,
 *   new_data: newState,
 * });
 * ```
 *
 * @returns {CreateAuditLogResult} with success status, created ID, and any error.
 */
export async function createAuditLog(
  params: CreateAuditLogParams,
): Promise<CreateAuditLogResult> {
  const {
    supabase,
    action,
    table_name,
    record_id,
    user_id,
    organization_id,
    branch_id,
    old_data,
    new_data,
  } = params;

  // Resolve user_id from auth session if not provided
  let resolvedUserId = user_id;
  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    resolvedUserId = user?.id;
  }

  if (!resolvedUserId) {
    return {
      success: false,
      id: null,
      error:
        "Unable to determine user_id: no authenticated user and no user_id param provided",
    };
  }

  // Resolve organization_id if not provided
  let resolvedOrgId = organization_id;
  if (!resolvedOrgId) {
    const { data, error } = await supabase.rpc("get_user_organization_id");
    if (error || !data) {
      return {
        success: false,
        id: null,
        error:
          "Unable to determine organization_id: user has no organization membership",
      };
    }
    resolvedOrgId = data as string;
  }

  const entry: AuditLogInsert = {
    organization_id: resolvedOrgId,
    user_id: resolvedUserId,
    action,
    table_name,
    record_id,
    old_data: old_data as Json | undefined,
    new_data: new_data as Json | undefined,
  };

  if (branch_id) {
    entry.branch_id = branch_id;
  }

  const { data, error } = await supabase
    .from("audit_logs")
    // biome-ignore lint/suspicious/noExplicitAny: Supabase Relationships type inference limitation
    .insert(entry as any)
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }

  return {
    success: true,
    id: (data as { id: string } | null)?.id ?? null,
    error: null,
  };
}
/**
 * Schedules an audit log entry to run after the response is sent.
 * Use this instead of createAuditLog() in mutation service functions
 * to avoid blocking the response.
 */
export function logAuditAfter(params: CreateAuditLogParams): void {
  after(async () => {
    await createAuditLog(params);
  });
}
