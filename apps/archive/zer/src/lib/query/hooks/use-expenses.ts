"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { expenseKeys } from "@/lib/query/keys";

export const useExpenses = createSimpleQuery({
  keys: expenseKeys,
  table: "expenses",
  select: "id, category, amount, description, payment_method, expense_date",
  orderBy: "expense_date",
  orderDirection: "desc",
});
