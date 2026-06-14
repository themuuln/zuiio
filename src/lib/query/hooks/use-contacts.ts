"use client";

import { useQuery } from "@tanstack/react-query";
import { contactKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export function useContacts(orgId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: contactKeys.lists(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
