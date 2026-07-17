import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TrainingLog {
  id: string;
  owner_id: string;
  horse_id: string;
  type: string;
  date: string;
  duration_minutes: number;
  distance_km: number | null;
  notes: string;
  handler_name: string | null;
  weather: string | null;
  created_at: string;
}

export function useTrainingLogs(horseId: string | undefined) {
  return useQuery({
    queryKey: ["training", horseId],
    queryFn: async () => {
      if (!horseId) return [];

      const { data, error } = await supabase
        .from("training_logs")
        .select("*")
        .eq("horse_id", horseId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching training logs:", error);
        throw error;
      }

      return data as TrainingLog[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}
