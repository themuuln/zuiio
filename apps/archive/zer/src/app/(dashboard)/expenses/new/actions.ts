"use server";
import { capture, withDbCapture } from "@zuiio/capture";

import { postExpenseToJournal } from "@/lib/accounting";
import { requireWriteAction } from "@/lib/action-utils";
import { validateExpenseInput } from "@/lib/domain-rules";
import { parseAmount } from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";
import { expenseSchema } from "@/lib/validation-schemas";

export async function createExpense(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("expenses.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const category = getString(formData, "category");
  const amount = parseAmount(formData.get("amount"));
  const expenseDate = getString(formData, "expense_date") || formatRouteDate();
  const description = getString(formData, "description") || null;
  const parsedExpense = expenseSchema.safeParse({
    category,
    amount: formData.get("amount"),
    expense_date: expenseDate,
    description,
    payment_method: getString(formData, "payment_method") || "cash",
  });
  if (!parsedExpense.success) {
    return {
      error: parsedExpense.error.issues[0]?.message || "Мэдээлэл буруу байна.",
    };
  }

  const validationError = validateExpenseInput({ category, amount });
  if (validationError) {
    return { error: validationError };
  }

  if (!branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  const { data: expense, error } = await withDbCapture(
    "expenses: createExpense",
    supabase
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
      .single(),
  );

  if (error) {
    capture(error, { context: "expenses: createExpense" });
    return { error: error.message };
  }

  // Post to general ledger (fire-and-forget with error capture)
  try {
    await postExpenseToJournal(
      supabase,
      organizationId,
      userId,
      branchId,
      expense.id,
      {
        amount,
        expense_date: expenseDate,
        category,
        description,
      },
    );
  } catch (err) {
    capture(err, { context: "expense: postExpenseToJournal" });
  }

  revalidateEntities(["expenses"]);
  return { success: true as const, error: undefined };
}
