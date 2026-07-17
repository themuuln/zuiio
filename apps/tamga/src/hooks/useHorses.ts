import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Horse {
  id: string;
  name: string;
  gender: "stallion" | "mare" | "gelding";
  coat: string;
  birth_year: number;
  owner_id: string;
  microchip_id: string | null;
  registration_no: string | null;
  created_at: string;
  updated_at: string;
}

export function useHorses(userId: string | undefined) {
  return useQuery({
    queryKey: ["horses", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching horses:", error);
        throw error;
      }

      return data as Horse[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHorse(id: string | undefined) {
  return useQuery({
    queryKey: ["horse", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching horse:", error);
        throw error;
      }

      return data as Horse;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
