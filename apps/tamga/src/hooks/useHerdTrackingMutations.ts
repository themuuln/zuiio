import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PastureZone } from "./useHerdTracking";

// ── Input types ──────────────────────────────────────────────────────

interface UpdateLocationInput {
  horseId: string;
  lat: number;
  lng: number;
  source: "gps" | "manual" | "api";
  horseName?: string;
  ownerId: string;
  ownerName?: string;
  coatColor?: string;
}

interface CreatePastureZoneInput {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  maxOccupancyDays?: number;
  ownerId: string;
}

interface UpdatePastureZoneInput {
  id: string;
  name?: string;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  maxOccupancyDays?: number;
  isActive?: boolean;
}

// ── Mutations ────────────────────────────────────────────────────────

/**
 * Моринын байршлыг шинэчлэх — UPSERT. Хэрэв морь байршилгүй бол үүсгэнэ,
 * байвал шинэчилнэ.
 */
export function useUpdateHorseLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLocationInput) => {
      const { data, error } = await supabase
        .from("horse_locations")
        .upsert(
          {
            horse_id: input.horseId,
            owner_id: input.ownerId,
            horse_name: input.horseName ?? "",
            owner_name: input.ownerName ?? "",
            lat: input.lat,
            lng: input.lng,
            last_updated: new Date().toISOString(),
            is_visible: true,
            coat_color: input.coatColor,
          },
          { onConflict: "horse_id" },
        )
        .select()
        .single();

      if (error) {
        console.error("Алдаа: байршлыг шинэчилж чадсангүй:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horse-locations"] });
      queryClient.invalidateQueries({ queryKey: ["herd-tracking-status"] });
    },
  });
}

/**
 * Бэлчээрийн бүс үүсгэх.
 */
export function useCreatePastureZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePastureZoneInput) => {
      const { data, error } = await supabase
        .from("pasture_zones")
        .insert({
          owner_id: input.ownerId,
          name: input.name,
          center_lat: input.centerLat,
          center_lng: input.centerLng,
          radius_km: input.radiusKm,
          max_occupancy_days: input.maxOccupancyDays ?? 14,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Алдаа: бүсийг үүсгэж чадсангүй:", error);
        throw error;
      }

      return data as PastureZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pasture-zones"] });
    },
  });
}

/**
 * Бэлчээрийн бүсийг шинэчлэх.
 */
export function useUpdatePastureZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePastureZoneInput) => {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.centerLat !== undefined) payload.center_lat = updates.centerLat;
      if (updates.centerLng !== undefined) payload.center_lng = updates.centerLng;
      if (updates.radiusKm !== undefined) payload.radius_km = updates.radiusKm;
      if (updates.maxOccupancyDays !== undefined)
        payload.max_occupancy_days = updates.maxOccupancyDays;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from("pasture_zones")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Алдаа: бүсийг шинэчилж чадсангүй:", error);
        throw error;
      }

      return data as PastureZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pasture-zones"] });
    },
  });
}

/**
 * Бэлчээрийн бүсийг устгах.
 */
export function useDeletePastureZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneId: string) => {
      const { error } = await supabase.from("pasture_zones").delete().eq("id", zoneId);

      if (error) {
        console.error("Алдаа: бүсийг устгаж чадсангүй:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pasture-zones"] });
      queryClient.invalidateQueries({ queryKey: ["zone-assignments"] });
    },
  });
}

/**
 * Морийг бүсэд хуваарилах.
 */
export function useAssignHorseToZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, horseId }: { zoneId: string; horseId: string }) => {
      const { data, error } = await supabase
        .from("pasture_assignments")
        .insert({ zone_id: zoneId, horse_id: horseId })
        .select()
        .single();

      if (error) {
        console.error("Алдаа: морийг хуваарилж чадсангүй:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zone-assignments", variables.zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zone-assignments"] });
    },
  });
}

/**
 * Морийг бүсээс хасах.
 */
export function useRemoveHorseFromZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, horseId }: { zoneId: string; horseId: string }) => {
      const { error } = await supabase
        .from("pasture_assignments")
        .delete()
        .eq("zone_id", zoneId)
        .eq("horse_id", horseId);

      if (error) {
        console.error("Алдаа: морийг хасаж чадсангүй:", error);
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zone-assignments", variables.zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zone-assignments"] });
    },
  });
}
