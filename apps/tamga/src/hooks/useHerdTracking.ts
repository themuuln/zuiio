import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Interfaces ───────────────────────────────────────────────────────

export interface HorseLocation {
  id?: string;
  horse_id: string;
  lat: number;
  lng: number;
  recorded_at?: string;
  source?: "gps" | "manual" | "api";
  horse_name?: string;
}

export interface PastureZone {
  id: string;
  owner_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  max_occupancy_days: number;
  last_rotation_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PastureAssignment {
  id: string;
  zone_id: string;
  horse_id: string;
  assigned_at: string;
}

// ── Query hooks ──────────────────────────────────────────────────────

/**
 * Моринын байршлыг хайх — тодорхой моринын ID-уудаар.
 */
export function useHorseLocations(horseIds: string[]) {
  return useQuery({
    queryKey: ["horse-locations", horseIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horse_locations")
        .select("*")
        .in("horse_id", horseIds.length > 0 ? horseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (error) {
        console.error("Алдаа: моринын байршлыг татаж чадсангүй:", error);
        throw error;
      }

      return (data ?? []) as HorseLocation[];
    },
    enabled: horseIds.length > 0,
    staleTime: 1000 * 30, // 30 секунд — GPS мэдээлэл хурдан хуучирна
    refetchInterval: 1000 * 60, // 1 минут тутам шинэчлэх
  });
}

/**
 * Малын сүрэгийн нийт байршлын төлөв — хичнээн морь идэвхтэй, хамгийн сүүлд хэзээ шинэчлэгдсэн.
 */
export function useHerdTrackingStatus() {
  return useQuery({
    queryKey: ["herd-tracking-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horse_locations")
        .select("horse_id, horse_name, lat, lng, last_updated, is_visible");

      if (error) {
        console.error("Алдаа: сүрэгийн төлөвийг татаж чадсангүй:", error);
        throw error;
      }

      const locations = data ?? [];
      const visibleCount = locations.filter((l) => l.is_visible).length;
      const latestUpdate = locations.reduce(
        (latest, l) => {
          const t = new Date(l.last_updated).getTime();
          return t > latest ? t : latest;
        },
        0,
      );

      return {
        totalTracked: locations.length,
        visibleCount,
        latestUpdate: latestUpdate > 0 ? new Date(latestUpdate).toISOString() : null,
        horses: locations.map((l) => ({
          horseId: l.horse_id,
          horseName: l.horse_name,
          lat: l.lat,
          lng: l.lng,
          isVisible: l.is_visible,
          lastUpdated: l.last_updated,
        })),
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Хэрэглэгчийн бэлчээрийн бүсийн жагсаалт.
 */
export function usePastureZones(userId: string | undefined) {
  return useQuery({
    queryKey: ["pasture-zones", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("pasture_zones")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Алдаа: бэлчээрийн бүсийг татаж чадсангүй:", error);
        throw error;
      }

      return (data ?? []) as PastureZone[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Бүс дээрх моринын хуваарилалтын жагсаалт.
 */
export function useZoneAssignments(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["zone-assignments", zoneId],
    queryFn: async () => {
      if (!zoneId) return [];

      const { data, error } = await supabase
        .from("pasture_assignments")
        .select("*, horses(name)")
        .eq("zone_id", zoneId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Алдаа: хуваарилалтыг татаж чадсангүй:", error);
        throw error;
      }

      return (data ?? []) as (PastureAssignment & { horses: { name: string } | null })[];
    },
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 5,
  });
}