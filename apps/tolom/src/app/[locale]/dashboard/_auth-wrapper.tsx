"use client";

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePreloadStatus } from "@/lib/hooks/use-preload-status";
import { useCurrentOrg } from "@/lib/queries/use-organization";

/**
 * Auth wrapper that handles authentication, subscription guard, and offline preload.
 * The preload runs silently in background for offline caching — no blocking overlay.
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

  // Preload fires automatically in the background (IndexedDB for offline access)
  usePreloadStatus(orgInfo?.orgId);

  if (!orgInfo) return children;

  return (
    <SubscriptionGuard
      orgId={orgInfo.orgId}
      orgName={orgInfo.orgName ?? "Organization"}
    >
      {children}
    </SubscriptionGuard>
  );
}
