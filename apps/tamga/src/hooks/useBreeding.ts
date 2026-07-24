import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BreedingRecord {
  id: string;
  sire_id: string | null;
  sire_name: string | null;
  dam_id: string | null;
  dam_name: string | null;
  breeding_date: string;
  expected_foaling_date: string | null;
  actual_foaling_date: string | null;
  status: string;
  herd_label: string | null;
  notes: string | null;
  foal_id: string | null;
  foal_name: string | null;
  foal_gender: string | null;
  foal_color: string | null;
  owner_id: string;
  created_at: string;
}

export function useBreedingRecords(ownerId: string | undefined) {
  return useQuery({
    queryKey: ["breeding", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];

      const { data, error } = await supabase
        .from("breeding_records")
        .select("*")
        .eq("owner_id", ownerId)
        .order("breeding_date", { ascending: false });

      if (error) {
        console.error("Error fetching breeding records:", error);
        throw error;
      }

      return data as BreedingRecord[];
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5,
  });
}
