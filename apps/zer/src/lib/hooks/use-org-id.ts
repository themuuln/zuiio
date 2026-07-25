"use client";

import { useQuery } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns the current organization ID.
 *
 * First tries `useOrgSettings()` context (set by the dashboard shell).
 * Falls back to a React Query-cached `getUser() → profiles` lookup.
 *
 * Eliminates the redundant `getUser() → profiles → orgId` chain that
 * multiple drawers (BOM, production, quality) duplicate independently.
 */
export function useOrgId(): {
  organizationId: string | null;
  isLoading: boolean;
} {
  const orgSettings = useOrgSettings();

  // Always call useQuery unconditionally (Rules of Hooks).
  // enabled=false when context already provides the orgId.
  const { data: fallbackOrgId, isLoading } = useQuery({
    queryKey: ["useOrgId", "fallback"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      capture("useOrgId: fallback lookup used — context was empty");
      return profile?.organization_id ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !orgSettings.organizationId,
  });

  return {
    organizationId: orgSettings.organizationId || (fallbackOrgId ?? null),
    isLoading: orgSettings.organizationId ? false : isLoading,
  };
}
