"use client";

import { useQuery } from "@tanstack/react-query";
import { productKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export function useProducts(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: productKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
