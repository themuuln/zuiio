import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCreateTrainingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      owner_id: string;
      horse_id: string;
      type: string;
      date: string;
      duration_minutes: number;
      distance_km?: number;
      notes?: string;
      handler_name?: string;
      weather?: string;
    }) => {
      const { data, error } = await supabase
        .from("training_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["training", variables.horse_id],
      });
    },
  });
}

export function useDeleteTrainingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, horse_id }: { id: string; horse_id: string }) => {
      const { error } = await supabase
        .from("training_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return horse_id;
    },
    onSuccess: (horse_id) => {
      queryClient.invalidateQueries({ queryKey: ["training", horse_id] });
    },
  });
}
