"use server";

import { revalidatePath } from "next/cache";
import { postExpenseToJournal } from "@/lib/accounting";
import { validateExpenseInput } from "@/lib/domain-rules";
import { checkPermission, parseAmount, requireAppContext } from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { getString } from "@/lib/validation";

export async function createExpense(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "expenses.create");
  if (permError) return { error: permError };

  // Scoped users must have a branch
  if (isBranchScoped && !branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  const category = getString(formData, "category");
  const amount = parseAmount(formData.get("amount"));
  const expenseDate = getString(formData, "expense_date") || formatRouteDate();
  const description = getString(formData, "description") || null;
  const validationError = validateExpenseInput({ category, amount });
  if (validationError) {
    return { error: validationError };
  }

  if (!branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      category,
      amount,
      expense_date: expenseDate,
      description,
      payment_method: getString(formData, "payment_method") || "cash",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Post to general ledger (fire-and-forget)
  postExpenseToJournal(supabase, organizationId, userId, expense.id, {
    amount,
    expense_date: expenseDate,
    category,
    description,
  }).catch(console.error);

  revalidatePath("/");
  revalidatePath("/expenses");
  return { success: true as const };
}
