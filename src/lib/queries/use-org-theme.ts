"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import type { OrgTheme } from "@/lib/types";

interface ThemeResponse {
  theme: OrgTheme;
  isDefault: boolean;
}

export function useOrgThemeQuery(orgId: string | null) {
  return useQuery({
    queryKey: ["org-theme", orgId],
    queryFn: async (): Promise<ThemeResponse> => {
      if (!orgId) {
        return {
          theme: {
            primaryColor: "oklch(0.205 0 0)",
            accentColor: "oklch(0.97 0 0)",
            radius: "0px",
            fontFamily: "Inter, sans-serif",
          },
          isDefault: true,
        };
      }
      const res = await fetch(`/api/organizations/${orgId}/theme`);
      if (!res.ok) throw new Error("Failed to fetch theme");
      return res.json();
    },
    enabled: !!orgId,
    staleTime: Infinity,
  });
}

export function useUpdateOrgTheme(orgId: string | null) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (theme: OrgTheme) => {
      if (!orgId) throw new Error("No org ID");

      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(theme),
        });
        if (!res.ok) throw new Error("Failed to update theme");
        return res.json();
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/theme`,
        method: "POST",
        body: theme,
        queryKeysToInvalidate: [["org-theme", orgId]],
      });
      return { queued: true } as unknown as { theme: OrgTheme };
    },
    onSuccess: (data: { theme: OrgTheme }) => {
      const d = data as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.setQueryData(["org-theme", orgId], data);
      }
    },
  });
}
