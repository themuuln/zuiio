import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Event } from "./useEvents";

const PAGE_SIZE = 20;

export function useEventsPaginated(ownerId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["events-paginated", ownerId],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam - 1) * PAGE_SIZE;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", ownerId!)
        .order("date", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      return data as Event[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5,
  });
}

export { PAGE_SIZE as EVENT_PAGE_SIZE };
