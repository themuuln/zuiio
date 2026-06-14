"use server";

import { revalidatePath } from "next/cache";
import { validateExpenseInput } from "@/lib/domain-rules";
import { parseAmount, requireAppContext } from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { getString } from "@/lib/validation";

export async function createExpense(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

  const category = getString(formData, "category");
  const amount = parseAmount(formData.get("amount"));
  const validationError = validateExpenseInput({ category, amount });
  if (validationError) {
    return { error: validationError };
  }

  const { error } = await supabase.from("expenses").insert({
    organization_id: organizationId,
    category,
    amount,
    expense_date: getString(formData, "expense_date") || formatRouteDate(),
    description: getString(formData, "description") || null,
    payment_method: getString(formData, "payment_method") || "cash",
    created_by: userId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/expenses");
  return { success: true as const };
}
