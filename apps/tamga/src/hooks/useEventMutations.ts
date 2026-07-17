import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      horse_id: string;
      event_type: string;
      title: string;
      location?: string;
      date: string;
      result?: string;
      prize_amount?: number;
      notes?: string;
      horse_name?: string;
    }) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...event,
          owner_id: HARDCODED_USER_ID,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
