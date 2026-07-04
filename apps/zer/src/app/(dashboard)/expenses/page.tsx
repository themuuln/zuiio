import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { ExpensesContent } from "./expenses-content";
import type { ExpenseRow } from "./expenses-table";



export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: urlBranch } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const { data: expenses } = await withBranchFilter(
    supabase
      .from("expenses")
      .select("id, category, amount, description, payment_method, expense_date")
      .eq("organization_id", organizationId)
      .order("expense_date", { ascending: false }),
    branchId,
    isBranchScoped,
    urlBranch,
  );

  const tableData: ExpenseRow[] =
    expenses?.map((expense) => ({
      id: expense.id,
      expense_date: expense.expense_date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      payment_method: expense.payment_method,
    })) ?? [];

  return <ExpensesContent expenses={tableData} />;
}
