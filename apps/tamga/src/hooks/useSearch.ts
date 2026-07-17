import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

const RECENT_SEARCHES_KEY = "tamga_recent_searches";
const MAX_RECENT = 10;

export interface HorseResult {
  id: string;
  name: string;
  gender: string;
  coat: string;
  birth_year: number;
}

export interface ListingResult {
  id: string;
  horse_id: string;
  listing_type: string;
  price_mnt: number | null;
  status: string;
  location: string | null;
  horse_name?: string;
  horse_coat?: string;
}

export interface EventResult {
  id: string;
  horse_id: string;
  event_type: string;
  title: string;
  date: string;
  location: string | null;
  horse_name: string;
}

export interface SearchResults {
  horses: HorseResult[];
  listings: ListingResult[];
  events: EventResult[];
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => {
      if (raw) setRecentSearches(JSON.parse(raw));
    });
  }, []);

  const addRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(
        0,
        MAX_RECENT,
      );
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const removeRecentSearch = useCallback(async (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== term);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const searchEnabled = debouncedQuery.trim().length >= 2;

  const { data, isPending, refetch } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async (): Promise<SearchResults> => {
      const q = debouncedQuery.trim();
      const [horsesRes, listingsRes, eventsRes] = await Promise.all([
        supabase
          .from("horses")
          .select("id, name, gender, coat, birth_year")
          .ilike("name", `%${q}%`)
          .limit(10),
        supabase
          .from("listings")
          .select(
            "id, horse_id, listing_type, price_mnt, status, location, horse_name, horse_coat",
          )
          .ilike("title", `%${q}%`)
          .limit(10),
        supabase
          .from("events")
          .select("id, horse_id, event_type, title, date, location, horse_name")
          .ilike("name", `%${q}%`)
          .limit(10),
      ]);

      return {
        horses: (horsesRes.data as HorseResult[]) ?? [],
        listings: (listingsRes.data as ListingResult[]) ?? [],
        events: (eventsRes.data as EventResult[]) ?? [],
      };
    },
    enabled: searchEnabled,
    staleTime: 1000 * 60,
  });

  return {
    query,
    setQuery,
    debouncedQuery,
    results: data ?? { horses: [], listings: [], events: [] },
    isPending: searchEnabled ? isPending : false,
    isIdle: !searchEnabled,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
    refetch,
  };
}
