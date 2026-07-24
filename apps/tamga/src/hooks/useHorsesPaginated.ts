import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Horse } from "./useHorses";

const PAGE_SIZE = 20;

export function useHorsesPaginated(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["horses-paginated", userId],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam - 1) * PAGE_SIZE;
      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching horses:", error);
        throw error;
      }

      return data as Horse[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export { PAGE_SIZE as HORSE_PAGE_SIZE };
