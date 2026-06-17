import { requireAppContext } from "@/lib/erp";
import { AccountingContent } from "./accounting-content";

export default async function AccountingPage() {
  const ctx = await requireAppContext();
  const { organizationId } = ctx;
  const db = ctx.supabase as any;

  const [{ data: trialBalance }, { data: accounts }, { data: journalEntries }] =
    await Promise.all([
      db.rpc("get_trial_balance", {
        p_organization_id: organizationId,
      }),
      db
        .from("chart_of_accounts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("code"),
      db
        .from("journal_entries")
        .select(
          `
          id,
          entry_date,
          entry_number,
          description,
          created_at,
          journal_entry_lines (
            id,
            debit_amount,
            credit_amount,
            account:chart_of_accounts (id, code, name)
          )
        `,
        )
        .eq("organization_id", organizationId)
        .order("entry_date", { ascending: false })
        .limit(50),
    ]);

  return (
    <AccountingContent
      trialBalance={trialBalance ?? []}
      accounts={accounts ?? []}
      journalEntries={journalEntries ?? []}
    />
  );
}
