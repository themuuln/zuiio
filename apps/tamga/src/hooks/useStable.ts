import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Stable {
  id: string;
  name: string;
  owner_id: string;
  location: string | null;
  capacity: number | null;
  current_count: number | null;
  description: string | null;
  created_at: string;
}

export function useStables(userId: string | undefined) {
  return useQuery({
    queryKey: ["stables", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("stables")
        .select("*")
        .eq("owner_id", userId)
        .order("name");

      if (error) throw error;
      return data as Stable[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStable(stableId: string | undefined) {
  return useQuery({
    queryKey: ["stable", stableId],
    queryFn: async () => {
      if (!stableId) return null;

      const { data, error } = await supabase
        .from("stables")
        .select("*, horses(id, name, coat, gender)")
        .eq("id", stableId)
        .single();

      if (error) throw error;
      return data as Stable & { horses: { id: string; name: string; coat: string; gender: string }[] };
    },
    enabled: !!stableId,
    staleTime: 1000 * 60 * 5,
  });
}
