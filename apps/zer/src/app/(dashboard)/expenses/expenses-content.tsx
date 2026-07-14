"use client";

import { Coins } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { ExpenseCreateDrawer } from "@/components/expenses/expense-create-drawer";
import { buttonVariants } from "@/components/ui/button";
import { useBranchContext } from "@/lib/branch-context";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { type ExpenseRow, ExpensesTable } from "./expenses-table";

export function ExpensesContent() {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialRef = useRef(createOpen);

  const { organizationId } = useOrgSettings();
  const { selectedBranchId, isBranchScoped, userBranchId } = useBranchContext();
  const effectiveBranchId = isBranchScoped
    ? userBranchId
    : (selectedBranchId ?? null);

  const query = useQuery({
    queryKey: ["expenses", organizationId, effectiveBranchId],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase
        .from("expenses")
        .select(
          "id, category, amount, description, payment_method, expense_date",
        )
        .eq("organization_id", organizationId)
        .order("expense_date", { ascending: false });
      if (effectiveBranchId) {
        q = q.eq("branch_id", effectiveBranchId);
      }
      const { data, error } = await withDbCapture("page:expenses expenses", q);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/expenses");
    }
  }, []);

  const expenses: ExpenseRow[] = (query.data ?? []).map((expense) => ({
    id: expense.id,
    expense_date: expense.expense_date,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    payment_method: expense.payment_method,
  }));
  const isLoading = query.isLoading || query.isFetching;

  return (
    <PageShell
      title="Зарлага"
      description="Байгууллагын зарлагын жагсаалт, ангилал, төлбөрийн мэдээлэл."
      actions={
        <>
          <ExportButton
            href="/api/export/expenses"
            filename={`expenses-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <ExpenseCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
        </>
      }
    >
      {isLoading ? (
        <ExpensesTable data={[]} loading={true} />
      ) : !expenses.length ? (
        <ErpEmptyState
          icon={<Coins className="size-4" />}
          title="Зарлага бүртгэгдээгүй"
          description="Шинэ зарлага нэмж, зардлын мэдээллээ хянана уу."
          action={
            <button
              type="button"
              className={buttonVariants({ variant: "default" })}
              onClick={() => setCreateOpen(true)}
            >
              <Coins className="size-4" />
              Шинэ зарлага
            </button>
          }
        />
      ) : (
        <ExpensesTable data={expenses} />
      )}
    </PageShell>
  );
}
