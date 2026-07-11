"use client";

import type { BrandConfig } from "@zuiio/branding";
import { generateBrandCSS } from "@zuiio/branding";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@zuiio/hooks";
import { toast } from "sonner";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";

export interface BrandThemeResponse {
  branding: BrandConfig;
  isDefault: boolean;
}

const THEME_QUERY_KEY = "org-theme" as const;

/** Update or remove the <style id="brand-theme"> element in the document. */
function applyBrandThemeStyle(css: string | null) {
  if (typeof document === "undefined") return;
  const id = "brand-theme";
  let el = document.getElementById(id);
  if (!css) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function useBrandThemeQuery(orgId: string | null) {
  return useQuery({
    queryKey: [THEME_QUERY_KEY, orgId],
    queryFn: async (): Promise<BrandThemeResponse> => {
      if (!orgId) {
        return { branding: { theme: "zuiio", radius: 0.5, logo_url: null }, isDefault: true };
      }
      const res = await fetch(`/api/organizations/${orgId}/theme`);
      if (!res.ok) throw new Error("Failed to fetch theme");
      const json = await res.json();
      return json.data as BrandThemeResponse;
    },
    enabled: !!orgId,
    staleTime: Infinity,
  });
}

export function useUpdateBrandTheme(orgId: string | null) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (config: BrandConfig) => {
      if (!orgId) throw new Error("No org ID");

      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error("Failed to update theme");
        const json = await res.json();
        return json.data as BrandThemeResponse;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/theme`,
        method: "PUT",
        body: config,
        queryKeysToInvalidate: [[THEME_QUERY_KEY, orgId]],
      });
      return { branding: config, isDefault: false, queued: true } as BrandThemeResponse & { queued: true };
    },
    onMutate: async (config) => {
      // Snapshot current value for rollback
      const previous = queryClient.getQueryData<BrandThemeResponse>([THEME_QUERY_KEY, orgId]);

      // Optimistic: update query cache and inject style
      queryClient.setQueryData<BrandThemeResponse>([THEME_QUERY_KEY, orgId], {
        branding: config,
        isDefault: false,
      });
      applyBrandThemeStyle(generateBrandCSS(config));

      return { previous };
    },
    onError: (_error, _config, context) => {
      // Rollback
      const prev = context?.previous;
      if (prev) {
        queryClient.setQueryData<BrandThemeResponse>([THEME_QUERY_KEY, orgId], prev);
        applyBrandThemeStyle(generateBrandCSS(prev.branding));
      }
      toast.error("Failed to save theme");
    },
    onSuccess: (data) => {
      if ("queued" in data && data.queued) {
        toast.info("Saved offline — will sync when connected");
      }
      // Keep optimistic style; server confirmed
    },
    onSettled: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: [THEME_QUERY_KEY, orgId] });
      }
    },
  });
}

export { applyBrandThemeStyle };
