"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { validateExpenseInput } from "@/lib/domain-rules";
import { parseAmount } from "@/lib/erp";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function updateExpense(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("expenses.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, branchId, isBranchScoped } = ctx;

  const id = getString(formData, "id");
  const category = getString(formData, "category");
  const amount = parseAmount(formData.get("amount"));
  const expenseDate = getString(formData, "expense_date");
  const description = getString(formData, "description") || null;
  const paymentMethod = getString(formData, "payment_method") || "cash";

  if (!id) return { error: "Зарлагын ID олдсонгүй." };

  const validationError = validateExpenseInput({ category, amount });
  if (validationError) {
    return { error: validationError };
  }

  let query = supabase
    .from("expenses")
    .update({
      category,
      amount,
      expense_date: expenseDate,
      description,
      payment_method: paymentMethod,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { error } = await query;

  if (error) {
    return { error: `Зарлага шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["expenses"]);
  return { success: true as const, error: undefined };
}
