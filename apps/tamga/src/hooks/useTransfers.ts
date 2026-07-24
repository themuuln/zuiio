import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Transfer {
  id: string;
  horse_id: string;
  from_owner_id: string;
  to_owner_id: string | null;
  to_phone: string | null;
  status: string;
  transfer_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  horses?: { name: string } | null;
}

export function useMyTransfers(userId: string | undefined) {
  return useQuery({
    queryKey: ["transfers", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("ownership_transfers")
        .select("*, horses(name)")
        .or(`from_owner_id.eq.${userId},to_owner_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transfers:", error);
        throw error;
      }

      return data as Transfer[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
