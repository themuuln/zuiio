import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CreateHorseInput {
  name: string;
  gender: string;
  coat: string;
  birth_year: number;
}

interface UpdateHorseInput {
  id: string;
  name?: string;
  gender?: string;
  coat?: string;
  birth_year?: number;
}

const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

export function useCreateHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (horse: CreateHorseInput) => {
      const { data, error } = await supabase
        .from("horses")
        .insert({
          ...horse,
          owner_id: DEV_USER_ID,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
    },
  });
}

export function useUpdateHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateHorseInput) => {
      const { data, error } = await supabase
        .from("horses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
    },
  });
}

export function useDeleteHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("horses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
    },
  });
}
