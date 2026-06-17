import { requireAppContext } from "@/lib/erp";
import type { ExpenseRow } from "./expenses-table";
import { ExpensesContent } from "./expenses-content";

export const unstable_instant = { prefetch: "static" };

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

  return <ExpensesContent expenses={tableData} />;
}
