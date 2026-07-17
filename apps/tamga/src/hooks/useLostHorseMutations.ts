import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

interface ReportLostHorseInput {
  description?: string;
  last_seen_lat?: number;
  last_seen_lng?: number;
  location_name?: string;
  contact_phone?: string;
  animal_type?: string;
  breed?: string;
  coat_color?: string;
}

export function useReportLostHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReportLostHorseInput) => {
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .insert({
          ...input,
          owner_id: DEV_USER_ID,
          status: "lost",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
      queryClient.invalidateQueries({ queryKey: ["myLostHorses"] });
    },
  });
}

export function useMarkFound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .update({ status: "found", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
    },
  });
}

export function useAddSighting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      last_seen_lat,
      last_seen_lng,
    }: {
      id: string;
      last_seen_lat?: number;
      last_seen_lng?: number;
    }) => {
      const { data: current, error: fetchError } = await supabase
        .from("lost_horse_reports")
        .select("sighting_count")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("lost_horse_reports")
        .update({
          sighting_count: (current?.sighting_count ?? 0) + 1,
          ...(last_seen_lat !== undefined && { last_seen_lat }),
          ...(last_seen_lng !== undefined && { last_seen_lng }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
    },
  });
}

export function useDeleteLostHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lost_horse_reports")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
      queryClient.invalidateQueries({ queryKey: ["myLostHorses"] });
    },
  });
}

export function useUpdateLostHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      description?: string;
      last_seen_lat?: number;
      last_seen_lng?: number;
      location_name?: string;
      contact_phone?: string;
      animal_type?: string;
      breed?: string;
      coat_color?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
      queryClient.invalidateQueries({ queryKey: ["myLostHorses"] });
    },
  });
}
