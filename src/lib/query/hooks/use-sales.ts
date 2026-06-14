"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { saleKeys } from "@/lib/query/keys";

export function useSales(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: saleKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
