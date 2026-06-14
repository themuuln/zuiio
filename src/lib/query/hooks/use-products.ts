"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { productKeys } from "@/lib/query/keys";

export function useProducts(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: productKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
