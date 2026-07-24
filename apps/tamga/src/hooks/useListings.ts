import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Listing {
  id: string;
  seller_id: string;
  horse_id: string;
  listing_type: "sale" | "lease" | "stud";
  price_mnt: number | null;
  description: string | null;
  status: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined from horses
  horse_name?: string;
  horse_coat?: string;
  horse_birth_year?: number;
  horse_gender?: string;
}

export interface ListingRow {
  id: string;
  seller_id: string;
  horse_id: string;
  listing_type: string;
  price_mnt: number | null;
  description: string | null;
  status: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  horses?: {
    name: string;
    coat: string;
    birth_year: number;
    gender: string;
  } | null;
}

function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    seller_id: row.seller_id,
    horse_id: row.horse_id,
    listing_type: row.listing_type as Listing["listing_type"],
    price_mnt: row.price_mnt,
    description: row.description,
    status: row.status,
    location: row.location,
    created_at: row.created_at,
    updated_at: row.updated_at,
    horse_name: row.horses?.name,
    horse_coat: row.horses?.coat,
    horse_birth_year: row.horses?.birth_year,
    horse_gender: row.horses?.gender,
  };
}

export interface ListingFilters {
  type?: string;
  maxPrice?: number;
}

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, horses(name, coat, birth_year, gender)")
        .eq("status", "active");

      if (filters?.type) {
        query = query.eq("listing_type", filters.type);
      }
      if (filters?.maxPrice) {
        query = query.lte("price_mnt", filters.maxPrice);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;

      return (data as ListingRow[]).map(mapListing);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyListings(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-listings", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*, horses(name, coat, birth_year, gender)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ListingRow[]).map(mapListing);
    },
    enabled: !!userId,
  });
}
