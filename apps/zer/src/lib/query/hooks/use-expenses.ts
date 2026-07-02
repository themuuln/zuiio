"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { expenseKeys } from "@/lib/query/keys";

export const useExpenses = createSimpleQuery({
  keys: expenseKeys,
  table: "expenses",
  orderBy: "expense_date",
  orderDirection: "desc",
});
