import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PedigreeLink {
  id: string;
  horse_id: string;
  parent_id: string;
  relation: "sire" | "dam";
  verified: boolean;
  created_at: string;
  // Joined parent data
  parent_name?: string;
  parent_birth_year?: number;
  parent_coat?: string;
}

export function usePedigree(horseId: string | undefined) {
  return useQuery({
    queryKey: ["pedigree", horseId],
    queryFn: async () => {
      if (!horseId) return [];

      const { data, error } = await supabase
        .from("pedigree_links")
        .select("*")
        .eq("horse_id", horseId);

      if (error) {
        console.error("Error fetching pedigree:", error);
        throw error;
      }

      // Fetch parent names
      const links = data as PedigreeLink[];
      if (links.length === 0) return [];

      const parentIds = links.map((l) => l.parent_id);
      const { data: parents } = await supabase
        .from("horses")
        .select("id, name, birth_year, coat")
        .in("id", parentIds);

      const parentMap = new Map(
        (parents || []).map((p) => [p.id, p])
      );

      return links.map((link) => ({
        ...link,
        parent_name: parentMap.get(link.parent_id)?.name,
        parent_birth_year: parentMap.get(link.parent_id)?.birth_year,
        parent_coat: parentMap.get(link.parent_id)?.coat,
      }));
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}
