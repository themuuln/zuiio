import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError } from "@/lib/errors";
import type {
  CreateCustomerCommunicationParams,
  CustomerCommunication,
} from "@/lib/types";

/** Communication with staff display name joined from profiles. */
export interface CustomerCommunicationWithStaff extends CustomerCommunication {
  staff_name?: string | null;
}

/**
 * Lists communications for a customer, ordered by created_at DESC.
 * Includes the staff member's display name via profiles join.
 */
export async function getCustomerCommunications(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
): Promise<CustomerCommunicationWithStaff[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("customer_communications")
    .select("*, profiles:staff_id ( full_name )")
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profiles = row as {
      profiles: { full_name: string | null } | null;
    } & CustomerCommunication;
    return {
      ...profiles,
      staff_name: profiles.profiles?.full_name ?? null,
    };
  });
}

/**
 * Creates a communication record with audit log.
 */
export async function createCustomerCommunication(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
  params: CreateCustomerCommunicationParams,
  userId: string,
): Promise<CustomerCommunication> {
  const supabase = db;

  const { data, error } = await supabase
    .from("customer_communications")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      type: params.type,
      direction: params.direction,
      subject: params.subject?.trim() || null,
      content: params.content.trim(),
      staff_id: userId,
    })
    .select(
      "id, organization_id, customer_id, type, direction, subject, content, staff_id, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Failed to create customer communication",
    );
  }

  // Audit log
  logAuditAfter({
    supabase,
    action: "create",
    table_name: "customer_communications",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customerCommunications(orgId, customerId), "max");

  return data as unknown as CustomerCommunication;
}

/**
 * Soft-deletes a customer communication with audit log.
 */
export async function deleteCustomerCommunication(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
  commId: string,
  userId: string,
): Promise<void> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("customer_communications")
    .select("id")
    .eq("id", commId)
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    throw new NotFoundError("Customer communication not found");
  }

  const { error } = await supabase
    .from("customer_communications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  logAuditAfter({
    supabase,
    action: "soft_delete",
    table_name: "customer_communications",
    record_id: commId,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.customerCommunications(orgId, customerId), "max");
}
