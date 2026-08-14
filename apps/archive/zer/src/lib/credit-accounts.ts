import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import { formatCurrency } from "@/lib/format";
import type { Database } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EntryType = "sale_debit" | "payment_credit" | "refund" | "adjustment";

interface CreateEntryParams {
  organizationId: string;
  contactId: string;
  entryType: EntryType;
  amount: number;
  sourceType?: string | null;
  sourceId?: string | null;
  entryDate?: string | null;
  actorId?: string | null;
  note?: string | null;
}

export interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Derive the current outstanding balance for a contact from their
 * append-only account entries.
 *
 * Balance = sale_debits + adjustments − payment_credits − refunds.
 * Positive balance means the contact owes money; zero means settled;
 * negative means the organisation owes the contact (overpayment / refund
 * exceeding purchases).
 */
export async function getContactBalance(
  supabase: SupabaseClientType,
  organizationId: string,
  contactId: string,
): Promise<number> {
  const { data: rows, error } = await withDbCapture(
    "credit-accounts:get_balance",
    supabase
      .from("customer_account_entries")
      .select("entry_type, amount")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId),
  );

  if (error) {
    capture(error, { context: "credit-accounts: getContactBalance" });
    throw new Error("Үйлчлүгчийн үлдэгдэл татахад алдаа гарлаа.");
  }

  if (!rows || rows.length === 0) return 0;

  let balance = 0;
  for (const row of rows) {
    switch (row.entry_type as EntryType) {
      case "sale_debit":
        balance += row.amount;
        break;
      case "payment_credit":
        balance -= row.amount;
        break;
      case "refund":
        balance -= row.amount;
        break;
      case "adjustment":
        // Adjustments carry their own sign — positive increases debt,
        // negative decreases it.
        balance += row.amount;
        break;
    }
  }

  return balance;
}

/**
 * Available credit = credit_limit − current outstanding balance.
 * Returns null for the credit limit when the contact has no limit set,
 * which signals "no credit terms configured".
 */
export async function getAvailableCredit(
  supabase: SupabaseClientType,
  organizationId: string,
  contactId: string,
): Promise<{
  balance: number;
  creditLimit: number | null;
  available: number | null;
}> {
  const { data: contact, error: contactError } = await withDbCapture(
    "credit-accounts:fetch_contact",
    supabase
      .from("contacts")
      .select("credit_limit")
      .eq("organization_id", organizationId)
      .eq("id", contactId)
      .single(),
  );

  if (contactError || !contact) {
    capture(contactError ?? new Error("Contact not found"), {
      context: "credit-accounts: getAvailableCredit",
    });
    throw new Error("Үйлчлүгчийн мэдээлэл олдсонгүй.");
  }

  const balance = await getContactBalance(supabase, organizationId, contactId);
  const creditLimit = contact.credit_limit ?? null;
  const available = creditLimit !== null ? creditLimit - balance : null;

  return { balance, creditLimit, available };
}

/**
 * Insert a new account entry. All amounts are stored as positive
 * numbers — the entry_type determines whether they increase or
 * decrease the balance.
 */
export async function createAccountEntry(
  supabase: SupabaseClientType,
  params: CreateEntryParams,
): Promise<{ success: boolean; error?: string; entryId?: string }> {
  if (params.amount < 0) {
    return {
      success: false,
      error: "Бүртгэлийн дүн сөрөг байж болохгүй. Засварын төрөл сонгоно уу.",
    };
  }

  const validEntryTypes: EntryType[] = [
    "sale_debit",
    "payment_credit",
    "refund",
    "adjustment",
  ];
  if (!validEntryTypes.includes(params.entryType)) {
    return {
      success: false,
      error: `Буруу бүртгэлийн төрөл: ${params.entryType}`,
    };
  }

  try {
    const { data: entry, error } = await withDbCapture(
      "credit-accounts:create_entry",
      supabase
        .from("customer_account_entries")
        .insert({
          organization_id: params.organizationId,
          contact_id: params.contactId,
          entry_type: params.entryType,
          amount: params.amount,
          source_type: params.sourceType ?? null,
          source_id: params.sourceId ?? null,
          entry_date: params.entryDate ?? new Date().toISOString(),
          actor_id: params.actorId ?? null,
          note: params.note ?? null,
        })
        .select("id")
        .single(),
    );

    if (error) {
      capture(error, { context: "credit-accounts: createAccountEntry" });
      return { success: false, error: error.message };
    }

    return { success: true, entryId: entry.id };
  } catch (err: unknown) {
    capture(err, { context: "credit-accounts: createAccountEntry" });
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Бүртгэл үүсгэхэд алдаа гарлаа.",
    };
  }
}

/**
 * Check whether a new sale of `saleAmount` would exceed the contact's
 * credit limit. Returns `allowed: true` when:
 * - The contact has no credit limit configured (no restriction), OR
 * - balance + saleAmount ≤ credit_limit
 *
 * The caller MUST still hold an appropriate permission to override
 * (`sales.credit_limit_override`); this function only evaluates the
 * financial constraint.
 */
export async function checkCreditLimit(
  supabase: SupabaseClientType,
  organizationId: string,
  contactId: string,
  saleAmount: number,
): Promise<CreditCheckResult> {
  const { creditLimit, balance } = await getAvailableCredit(
    supabase,
    organizationId,
    contactId,
  );

  // No credit limit configured — no restriction.
  if (creditLimit === null) {
    return { allowed: true };
  }

  const projectedBalance = balance + saleAmount;
  const available = creditLimit - balance;

  if (projectedBalance <= creditLimit) {
    return { allowed: true };
  }

  const shortfall = projectedBalance - creditLimit;
  return {
    allowed: false,
    reason: `Зээлийн хязгаар хэтэрсэн. Хязгаар: ${formatCurrency(creditLimit)}, одоогийн үлдэгдэл: ${formatCurrency(balance)}, зөвшөөрөгдөх нэмэлт: ${formatCurrency(Math.max(0, available))}, шаардлагатай: ${formatCurrency(saleAmount)}, илүү: ${formatCurrency(shortfall)}`,
  };
}
