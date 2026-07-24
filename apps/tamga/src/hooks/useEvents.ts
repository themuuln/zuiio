import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Event {
  id: string;
  horse_id: string;
  owner_id: string;
  event_type: string;
  title: string;
  location: string | null;
  date: string;
  result: string | null;
  prize_amount: number | null;
  notes: string | null;
  horse_name: string;
  created_at: string;
}

export function useEvents(ownerId: string | undefined) {
  return useQuery({
    queryKey: ["events", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", ownerId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      return data as Event[];
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5,
  });
}
