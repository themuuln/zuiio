import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CreateStableInput {
  name: string;
  location?: string;
  capacity?: number;
  description?: string;
}

export function useCreateStable(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStableInput) => {
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("stables")
        .insert({ ...input, owner_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stables", userId] });
    },
  });
}

export function useUpdateStable(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateStableInput>) => {
      const { error } = await supabase
        .from("stables")
        .update(input)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stables", userId] });
    },
  });
}

export function useDeleteStable(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stables", userId] });
    },
  });
}
