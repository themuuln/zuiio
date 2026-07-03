"use client";

import { useQuery } from "@tanstack/react-query";
import { expenseKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export function useExpenses(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: expenseKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", orgId)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
