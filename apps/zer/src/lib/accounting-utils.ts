import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { after } from "next/server";
import { type EntityType, logAuditEventWithClient } from "@/lib/audit";
import type { Database } from "@/lib/supabase/types";

type AccountingLine = {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
};

/**
 * Shared journal entry creation helper.
 *
 * Reduces ~70% boilerplate duplication across postSaleToJournal,
 * postExpenseToJournal, and postPurchaseToJournal.
 *
 * Steps:
 * 1. Fetches chart_of_accounts by code
 * 2. Generates entry number via RPC
 * 3. Validates debits = credits
 * 4. Creates journal entry record
 * 5. Inserts journal entry lines
 * 6. Logs audit event
 */
export async function createJournalEntry(
  supabase: SupabaseClient<Database>,
  {
    organizationId,
    userId,
    branchId,
    referenceType,
    referenceId,
    entryDate,
    description,
    accountCodes,
    lines,
  }: {
    organizationId: string;
    userId: string;
    branchId: string;
    referenceType: EntityType;
    referenceId: string;
    entryDate: string;
    description: string;
    accountCodes: string[];
    lines: AccountingLine[];
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the period is locked — check_period_locked not yet in generated Database types
    const untypedSupabase = supabase as SupabaseClient;
    const { data: isLocked } = await untypedSupabase.rpc(
      "check_period_locked",
      {
        p_check_date: entryDate,
        p_org_id: organizationId,
      },
    );
    if (isLocked === true) {
      return {
        success: false,
        error: "Энэ мөчлөг хаагдсан байна. Засварлах боломжгүй.",
      };
    }

    // 1. Fetch accounts by code
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, code")
      .eq("organization_id", organizationId)
      .in("code", accountCodes);

    if (!accounts || accounts.length < 2) {
      return { success: false, error: "Дансны бүртгэл олдсонгүй." };
    }

    const accountMap = new Map(
      (accounts as Array<{ id: string; code: string }>).map((a) => [
        a.code,
        a.id,
      ]),
    );

    // Resolve account IDs from codes
    const resolvedLines = lines.map((line) => {
      const accountId = accountMap.get(line.account_id);
      if (!accountId) {
        throw new Error(`Данс олдсонгүй: ${line.account_id}`);
      }
      return { ...line, account_id: accountId };
    });

    // 2. Generate entry number
    const { data: jeData, error: jeError } = await supabase.rpc(
      "generate_journal_entry_number",
    );

    if (jeError) return { success: false, error: jeError.message };
    const entryNumber = jeData as string;

    // 3. Validate debits = credits
    const totalDebits = resolvedLines.reduce((s, l) => s + l.debit_amount, 0);
    const totalCredits = resolvedLines.reduce((s, l) => s + l.credit_amount, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return { success: false, error: "Дебет ба кредит дүн тэнцүү биш байна." };
    }

    // 4. Create journal entry
    const { data: journalEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        entry_date: entryDate,
        entry_number: entryNumber,
        reference_type: referenceType,
        reference_id: referenceId,
        description,
        created_by: userId,
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message };

    // 5. Insert lines
    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(
        resolvedLines.map((l) => ({
          journal_entry_id: journalEntry.id,
          account_id: l.account_id,
          debit_amount: l.debit_amount,
          credit_amount: l.credit_amount,
        })),
      );

    if (linesError) return { success: false, error: linesError.message };

    // 6. Audit log
    after(() =>
      logAuditEventWithClient(
        supabase,
        organizationId,
        userId,
        "created",
        referenceType,
        referenceId,
        undefined,
        `Журналын бичилт ${entryNumber} үүсгэсэн`,
      ),
    );

    return { success: true };
  } catch (err: unknown) {
    capture(err, { context: "accounting-utils: createJournalEntry" });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Алдаа гарлаа",
    };
  }
}
