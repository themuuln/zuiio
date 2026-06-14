"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { inventoryKeys } from "@/lib/query/keys";

export function useInventory(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: inventoryKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*, products(name, sku, unit)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
