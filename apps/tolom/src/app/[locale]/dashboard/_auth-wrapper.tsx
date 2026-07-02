"use client";

import type { ReactNode } from "react";
import { PreloadScreen } from "@/components/preload-screen";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePreloadStatus } from "@/lib/hooks/use-preload-status";
import { useCurrentOrg } from "@/lib/queries/use-organization";

/**
 * Auth wrapper that handles authentication, subscription guard, and offline preload.
 * After login, preloads all critical data into IndexedDB for offline access.
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();
  const { progress, isPreloading } = usePreloadStatus(orgInfo?.orgId);

  if (!orgInfo) return children;

  // Show preload screen while fetching all data for offline access
  if (isPreloading && progress && !progress.complete) {
    return <PreloadScreen progress={progress} />;
  }

  return (
    <SubscriptionGuard
      orgId={orgInfo.orgId}
      orgName={orgInfo.orgName ?? "Organization"}
    >
      {children}
    </SubscriptionGuard>
  );
}
