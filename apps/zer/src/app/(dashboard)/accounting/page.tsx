import { requireAppContext } from "@/lib/erp";
import { AccountingContent } from "./accounting-content";



export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; consolidated?: string }>;
}) {
  const { branch: urlBranch, consolidated: urlConsolidated } =
    await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();
  // biome-ignore lint/suspicious/noExplicitAny: generated types don't include new accounting tables/RPCs
  const db = supabase as any;

  // If consolidated=true is specified, show all branches data (admin only)
  const showConsolidated = !isBranchScoped && urlConsolidated === "true";

  // Determine effective branch filter
  let effectiveBranchId: string | null;
  if (showConsolidated) {
    effectiveBranchId = null;
  } else if (isBranchScoped) {
    effectiveBranchId = branchId;
  } else {
    effectiveBranchId = urlBranch ?? null;
  }

  // Helper to add branch filter conditionally
  // biome-ignore lint/suspicious/noExplicitAny: query builder type not available in generated types
  const maybeFilter = (q: any) =>
    effectiveBranchId ? q.eq("branch_id", effectiveBranchId) : q;

  const [trialBalanceResult, accountsResult, journalEntriesResult] =
    await Promise.all([
      db.rpc("get_trial_balance", {
        p_organization_id: organizationId,
        p_branch_id: effectiveBranchId ?? null,
      }),
      maybeFilter(
        db
          .from("chart_of_accounts")
          .select("*")
          .eq("organization_id", organizationId)
          .order("code"),
      ),
      maybeFilter(
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
      ),
    ]);

  return (
    <AccountingContent
      trialBalance={trialBalanceResult.data ?? []}
      accounts={accountsResult.data ?? []}
      journalEntries={journalEntriesResult.data ?? []}
      isBranchScoped={isBranchScoped}
      showConsolidated={showConsolidated}
    />
  );
}
