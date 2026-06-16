"use client";

import { Coins } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { ExpensesCreateDrawer } from "@/components/expenses/expenses-create-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <ExpensesCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
        </>
      }
    >
      {!expenses.length ? (
        <ErpEmptyState
          icon={<Coins className="size-4" />}
          title="Зарлага бүртгэгдээгүй"
          description="Шинэ зарлага нэмж, зардлын мэдээллээ хянана уу."
          action={<ExpensesCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Зарлагын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesTable data={expenses} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
