import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCreateHealthLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      horse_id: string;
      log_type: string;
      date: string;
      notes?: string;
      medicament?: string;
      cost?: number;
      farrier_name?: string;
    }) => {
      const { data, error } = await supabase
        .from("health_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["health_logs", variables.horse_id],
      });
    },
  });
}

export function useUpdateHealthLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      horse_id,
      ...updates
    }: {
      id: string;
      horse_id: string;
      log_type?: string;
      date?: string;
      notes?: string;
      medicament?: string;
      cost?: number;
      farrier_name?: string;
    }) => {
      const { data, error } = await supabase
        .from("health_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["health_logs", variables.horse_id],
      });
    },
  });
}

export function useDeleteHealthLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, horse_id }: { id: string; horse_id: string }) => {
      const { error } = await supabase.from("health_logs").delete().eq("id", id);
      if (error) throw error;
      return horse_id;
    },
    onSuccess: (horse_id) => {
      queryClient.invalidateQueries({ queryKey: ["health_logs", horse_id] });
    },
  });
}
