import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Listing, ListingRow, ListingFilters } from "./useListings";

const PAGE_SIZE = 20;

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

export function useListingsPaginated(filters?: ListingFilters) {
  return useInfiniteQuery({
    queryKey: ["listings-paginated", filters],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam - 1) * PAGE_SIZE;

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

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      return (data as ListingRow[]).map(mapListing);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export { PAGE_SIZE as LISTING_PAGE_SIZE };
