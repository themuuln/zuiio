import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface HealthLog {
  id: string;
  horse_id: string;
  log_type: string;
  date: string;
  notes: string | null;
  medicament: string | null;
  cost: number | null;
  farrier_name: string | null;
  created_at: string;
}

export function useHealthLogs(horseId: string | undefined) {
  return useQuery({
    queryKey: ["health_logs", horseId],
    queryFn: async () => {
      if (!horseId) return [];

      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .eq("horse_id", horseId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching health logs:", error);
        throw error;
      }

      return data as HealthLog[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHealthLog(logId: string | undefined) {
  return useQuery({
    queryKey: ["health_log", logId],
    queryFn: async () => {
      if (!logId) return null;

      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .eq("id", logId)
        .single();

      if (error) {
        console.error("Error fetching health log:", error);
        throw error;
      }

      return data as HealthLog;
    },
    enabled: !!logId,
    staleTime: 1000 * 60 * 5,
  });
}

