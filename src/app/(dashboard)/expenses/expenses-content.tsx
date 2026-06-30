"use client";

import { Coins } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { ExpenseCreateDrawer } from "@/components/expenses/expense-create-drawer";
import { buttonVariants } from "@/components/ui/button";
import { type ExpenseRow, ExpensesTable } from "./expenses-table";

export function ExpensesContent({ expenses }: { expenses: ExpenseRow[] }) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/expenses");
    }
  }, []);

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
      {!expenses.length ? (
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
