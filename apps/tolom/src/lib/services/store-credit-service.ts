import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get store credit balance for a customer in an organization.
 */
export async function getStoreCreditBalance(
  supabase: SupabaseClient,
  customerId: string,
  orgId: string,
): Promise<number> {
  const { data } = await supabase
    .from("store_credit_balances")
    .select("balance")
    .eq("customer_id", customerId)
    .eq("organization_id", orgId)
    .single();

  return Number(data?.balance ?? 0);
}

/**
 * Get store credit balance for a customer by invoice ID.
 */
export async function getStoreCreditBalanceByInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  orgId: string,
): Promise<{ balance: number; customerName: string | null } | null> {
  // Get customer from invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id, customer_name")
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();

  if (!invoice?.customer_id) return null;

  const { data: balance } = await supabase
    .from("store_credit_balances")
    .select("balance")
    .eq("customer_id", invoice.customer_id)
    .eq("organization_id", orgId)
    .single();

  return {
    balance: Number(balance?.balance ?? 0),
    customerName: invoice.customer_name,
  };
}

/**
 * Get store credit transaction history for a customer.
 */
export async function getStoreCreditTransactions(
  supabase: SupabaseClient,
  customerId: string,
  orgId: string,
  options?: { limit?: number; offset?: number },
): Promise<
  Array<{
    id: string;
    amount: number;
    type: string;
    reference_type: string | null;
    notes: string | null;
    created_at: string;
  }>
> {
  let query = supabase
    .from("store_credit_transactions")
    .select("id, amount, type, reference_type, notes, created_at")
    .eq("customer_id", customerId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 20) - 1,
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message ?? "Failed to fetch transactions");

  return data ?? [];
}
