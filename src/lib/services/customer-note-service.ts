import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import type { CreateCustomerNoteParams, CustomerNote } from "@/lib/types";
import { createCrudService } from "./create-crud-service";

// ── Factory-backed CRUD ───────────────────────────────────────

const crud = createCrudService<
  CustomerNote,
  CreateCustomerNoteParams,
  Record<string, never>
>({
  tableName: "customer_notes",
  selectColumns:
    "id, organization_id, customer_id, content, type, created_by, created_at, updated_at",
  cacheTagKey: (orgId: string) => `customer-notes:${orgId}`,
  orderBy: { column: "created_at", direction: "desc" },
  hooks: {
    beforeCreate: async (params) => {
      return {
        content: params.content?.trim(),
        type: params.type ?? "general",
      } as Partial<CreateCustomerNoteParams>;
    },
    onQuery: (query, options) => {
      if (options?.customerId) {
        return (query as any).eq("customer_id", options.customerId);
      }
      return query;
    },
    afterCreate: async (result, ctx) => {
      const note = result as unknown as { customer_id: string };
      if (note.customer_id) {
        revalidateTag(cacheTags.customerNotes(ctx.orgId, note.customer_id), "max");
      }
    },
  },
});

// ── Backward-compatible wrappers ──────────────────────────────

/**
 * Lists notes for a customer, ordered by created_at DESC.
 */
export async function getCustomerNotes(
  db: SupabaseClient,
  orgId: string,
  customerId: string,
): Promise<CustomerNote[]> {
  const result = await crud.getAll(db, orgId, { customerId, pageSize: 1000 });
  return result.data;
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
  const result = await crud.create(
    db,
    orgId,
    { ...params, customer_id: customerId } as CreateCustomerNoteParams,
    userId,
  );
  revalidateTag(cacheTags.customerNotes(orgId, customerId), "max");
  return result;
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
  await crud.softDelete(db, orgId, noteId, userId);
  revalidateTag(cacheTags.customerNotes(orgId, customerId), "max");
}
