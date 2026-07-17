import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Interfaces ───────────────────────────────────────────────────────

export interface Sighting {
  id: string;
  report_id: string;
  reporter_id: string;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
  description: string | null;
  photo_url: string | null;
  is_anonymous: boolean;
  status: "pending" | "confirmed" | "dismissed";
  created_at: string;
}

interface ReportSightingInput {
  report_id: string;
  reporter_id: string;
  lat: number;
  lng: number;
  location_name?: string;
  description?: string;
  photo_url?: string;
  is_anonymous?: boolean;
}

// ── Query hooks ──────────────────────────────────────────────────────

/**
 * Алдагдсан морины мэдээлэл дээрх эзэн харсан тохиолдлуудыг татах.
 */
export function useSightings(reportId: string | undefined) {
  return useQuery({
    queryKey: ["sightings", reportId],
    queryFn: async () => {
      if (!reportId) return [];

      const { data, error } = await supabase
        .from("lost_horse_sightings")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sightings:", error);
        throw error;
      }

      return data as Sighting[];
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Бүх эзэн харсан тохиолдлуудыг татах (газрын зургийн тэмдэглээний тулд).
 */
export function useAllSightings() {
  return useQuery({
    queryKey: ["sightings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_horse_sightings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all sightings:", error);
        throw error;
      }

      return data as Sighting[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Mutation hooks ───────────────────────────────────────────────────

/**
 * Эзэн харсан тохиолдол нэмэх.
 */
export function useCreateSighting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReportSightingInput) => {
      const { data, error } = await supabase
        .from("lost_horse_sightings")
        .insert({
          report_id: input.report_id,
          reporter_id: input.reporter_id,
          lat: input.lat,
          lng: input.lng,
          location_name: input.location_name ?? null,
          description: input.description ?? null,
          photo_url: input.photo_url ?? null,
          is_anonymous: input.is_anonymous ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating sighting:", error);
        throw error;
      }

      // Алдагдсан морины мэдээллийн sighting тоог нэмэх
      await supabase.rpc("increment_sighting_count" as never, {
        p_report_id: input.report_id,
      } as never);

      return data as Sighting;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sightings", variables.report_id] });
      queryClient.invalidateQueries({ queryKey: ["sightings"] });
      queryClient.invalidateQueries({ queryKey: ["lostHorses"] });
    },
  });
}
