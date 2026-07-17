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
  time_of_day: string | null;
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

      if (error) {
        console.error("Error fetching feed logs:", error);
        throw error;
      }

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
        .order("time_of_day", { ascending: true });

      if (error) {
        console.error("Error fetching feed schedules:", error);
        throw error;
      }

      return data as FeedSchedule[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFeedLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      horse_id: string;
      feed_type: string;
      amount_kg: number;
      date: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("feed_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["feed_logs", variables.horse_id],
      });
    },
  });
}

export function useDeleteFeedLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, horse_id }: { id: string; horse_id: string }) => {
      const { error } = await supabase
        .from("feed_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return horse_id;
    },
    onSuccess: (horse_id) => {
      queryClient.invalidateQueries({ queryKey: ["feed_logs", horse_id] });
    },
  });
}

export function useCreateFeedSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: {
      horse_id: string;
      feed_type: string;
      amount_kg: number;
      frequency: string;
      time_of_day?: string;
    }) => {
      const { data, error } = await supabase
        .from("feed_schedules")
        .insert({ ...schedule, active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["feed_schedules", variables.horse_id],
      });
    },
  });
}

export function useToggleFeedSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      horse_id,
      active,
    }: {
      id: string;
      horse_id: string;
      active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("feed_schedules")
        .update({ active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["feed_schedules", variables.horse_id],
      });
    },
  });
}

export function useDeleteFeedSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      horse_id,
    }: {
      id: string;
      horse_id: string;
    }) => {
      const { error } = await supabase
        .from("feed_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return horse_id;
    },
    onSuccess: (horse_id) => {
      queryClient.invalidateQueries({ queryKey: ["feed_schedules", horse_id] });
    },
  });
}
