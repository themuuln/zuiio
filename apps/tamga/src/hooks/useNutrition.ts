import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface FeedLog {
  id: string;
  horse_id: string;
  feed_type: string;
  amount_kg: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface FeedSchedule {
  id: string;
  horse_id: string;
  feed_type: string;
  amount_kg: number;
  frequency: string;
  time_of_day: string;
  active: boolean;
  created_at: string;
}

export function useFeedLogs(horseId: string | undefined) {
  return useQuery({
    queryKey: ["feed_logs", horseId],
    queryFn: async () => {
      if (!horseId) return [];
      const { data, error } = await supabase
        .from("feed_logs")
        .select("*")
        .eq("horse_id", horseId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as FeedLog[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeedSchedules(horseId: string | undefined) {
  return useQuery({
    queryKey: ["feed_schedules", horseId],
    queryFn: async () => {
      if (!horseId) return [];
      const { data, error } = await supabase
        .from("feed_schedules")
        .select("*")
        .eq("horse_id", horseId)
        .order("time_of_day");
      if (error) throw error;
      return data as FeedSchedule[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFeedLog(horseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { feed_type: string; amount_kg: number; date: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("feed_logs")
        .insert({ ...input, horse_id: horseId, notes: input.notes ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed_logs", horseId] }),
  });
}

export function useDeleteFeedLog(horseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed_logs", horseId] }),
  });
}

export function useCreateFeedSchedule(horseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { feed_type: string; amount_kg: number; frequency: string; time_of_day: string }) => {
      const { data, error } = await supabase
        .from("feed_schedules")
        .insert({ ...input, horse_id: horseId, active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed_schedules", horseId] }),
  });
}

export function useToggleFeedSchedule(horseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("feed_schedules").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed_schedules", horseId] }),
  });
}

export function useDeleteFeedSchedule(horseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed_schedules", horseId] }),
  });
}
