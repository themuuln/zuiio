import { Coins } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { type ExpenseRow, ExpensesTable } from "./expenses-table";

export default async function ExpensesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, amount, description, payment_method, expense_date")
    .eq("organization_id", organizationId)
    .order("expense_date", { ascending: false });

  const tableData: ExpenseRow[] =
    expenses?.map((expense) => ({
      id: expense.id,
      expense_date: expense.expense_date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      payment_method: expense.payment_method,
    })) ?? [];

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
          <Button asChild size="sm">
            <Link href="/expenses/new">Шинэ зарлага</Link>
          </Button>
        </>
      }
    >
      {!expenses?.length ? (
        <ErpEmptyState
          icon={<Coins className="size-4" />}
          title="Зарлага бүртгэгдээгүй"
          description="Шинэ зарлага нэмж, зардлын мэдээллээ хянана уу."
          action={
            <Button asChild size="sm">
              <Link href="/expenses/new">Шинэ зарлага</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Зарлагын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesTable data={tableData} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
