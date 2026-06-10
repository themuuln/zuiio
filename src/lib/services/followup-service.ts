import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerFollowup } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────

export interface ListFollowupsParams {
  customerId?: string;
  status?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

// ── List follow-ups ────────────────────────────────────────────

export async function listFollowups(
  db: SupabaseClient,
  orgId: string,
  params: ListFollowupsParams = {},
): Promise<{ data: CustomerFollowup[]; count: number }> {
  const { customerId, status, assignedTo, page = 1, limit = 20 } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("customer_followups")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone, email),
      vehicle:vehicles(plate_number, make, model),
      assigned_user:profiles!customer_followups_assigned_to_fkey(first_name, last_name, email)
    `,
      { count: "exact" },
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("due_at", { ascending: true });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to list follow-ups: ${error.message}`);
  }

  return { data: (data ?? []) as CustomerFollowup[], count: count ?? 0 };
}

// ── Get single follow-up ───────────────────────────────────────

export async function getFollowup(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<CustomerFollowup | null> {
  const { data, error } = await db
    .from("customer_followups")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone, email),
      vehicle:vehicles(plate_number, make, model),
      assigned_user:profiles!customer_followups_assigned_to_fkey(first_name, last_name, email)
    `,
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get follow-up: ${error.message}`);
  }

  return data as CustomerFollowup;
}

// ── Create follow-up ───────────────────────────────────────────

export async function createFollowup(
  db: SupabaseClient,
  orgId: string,
  input: {
    customer_id: string;
    vehicle_id?: string;
    work_order_id?: string;
    estimate_id?: string;
    invoice_id?: string;
    type?: string;
    subject: string;
    notes?: string;
    due_at: string;
    assigned_to?: string;
    created_by?: string;
  },
): Promise<CustomerFollowup> {
  const { data, error } = await db
    .from("customer_followups")
    .insert({
      organization_id: orgId,
      customer_id: input.customer_id,
      vehicle_id: input.vehicle_id ?? null,
      work_order_id: input.work_order_id ?? null,
      estimate_id: input.estimate_id ?? null,
      invoice_id: input.invoice_id ?? null,
      type: input.type ?? "call",
      subject: input.subject,
      notes: input.notes ?? null,
      due_at: input.due_at,
      assigned_to: input.assigned_to ?? null,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create follow-up: ${error.message}`);
  }

  return data as CustomerFollowup;
}

// ── Update follow-up ───────────────────────────────────────────

export async function updateFollowup(
  db: SupabaseClient,
  id: string,
  orgId: string,
  input: {
    type?: string;
    subject?: string;
    notes?: string;
    due_at?: string;
    status?: string;
    outcome?: string;
    outcome_notes?: string;
    assigned_to?: string;
    completed_at?: string;
    cancelled_at?: string;
  },
): Promise<CustomerFollowup> {
  const { data, error } = await db
    .from("customer_followups")
    .update(input)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update follow-up: ${error.message}`);
  }

  return data as CustomerFollowup;
}

// ── Complete follow-up ─────────────────────────────────────────

export async function completeFollowup(
  db: SupabaseClient,
  id: string,
  orgId: string,
  outcome: string,
  outcomeNotes?: string,
): Promise<CustomerFollowup> {
  return updateFollowup(db, id, orgId, {
    status: "completed",
    completed_at: new Date().toISOString(),
    outcome,
    outcome_notes: outcomeNotes,
  });
}

// ── Cancel follow-up ───────────────────────────────────────────

export async function cancelFollowup(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<CustomerFollowup> {
  return updateFollowup(db, id, orgId, {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  });
}

// ── Delete follow-up (soft) ────────────────────────────────────

export async function deleteFollowup(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const { error } = await db
    .from("customer_followups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    throw new Error(`Failed to delete follow-up: ${error.message}`);
  }
}

// ── Get overdue follow-ups ─────────────────────────────────────

export async function getOverdueFollowups(
  db: SupabaseClient,
  orgId: string,
): Promise<CustomerFollowup[]> {
  const { data, error } = await db
    .from("customer_followups")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone, email),
      vehicle:vehicles(plate_number, make, model),
      assigned_user:profiles!customer_followups_assigned_to_fkey(first_name, last_name, email)
    `,
    )
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lt("due_at", new Date().toISOString())
    .is("deleted_at", null)
    .order("due_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get overdue follow-ups: ${error.message}`);
  }

  return (data ?? []) as CustomerFollowup[];
}
