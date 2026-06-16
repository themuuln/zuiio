"use client";

import { useQuery } from "@tanstack/react-query";
import { brandKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export function useBrands(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: brandKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .eq("organization_id", orgId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
