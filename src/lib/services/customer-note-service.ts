import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError } from "@/lib/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateCustomerNoteParams, CustomerNote } from "@/lib/types";

/**
 * Lists notes for a customer, ordered by created_at DESC.
 */
export async function getCustomerNotes(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
): Promise<CustomerNote[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("customer_notes")
    .select(
      "id, organization_id, customer_id, content, type, created_by, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Creates a note for a customer with audit log.
 */
export async function createCustomerNote(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
  params: CreateCustomerNoteParams,
  userId: string,
): Promise<CustomerNote> {
  const supabase = db;

  const { data, error } = await supabase
    .from("customer_notes")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      content: params.content.trim(),
      type: params.type ?? "general",
      created_by: userId,
    })
    .select(
      "id, organization_id, customer_id, content, type, created_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create customer note");
  }

  // Audit log
  await createAuditLog({
    supabase,
    action: "create",
    table_name: "customer_notes",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customerNotes(orgId, customerId), "max");

  return data as unknown as CustomerNote;
}

/**
 * Soft-deletes a customer note with audit log.
 */
export async function deleteCustomerNote(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
  noteId: string,
  userId: string,
): Promise<void> {
  const supabase = db;

  const { data: existing } = await supabase
    .from("customer_notes")
    .select("id")
    .eq("id", noteId)
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    throw new NotFoundError("Customer note not found");
  }

  const { error } = await supabase
    .from("customer_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "customer_notes",
    record_id: noteId,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.customerNotes(orgId, customerId), "max");
}
