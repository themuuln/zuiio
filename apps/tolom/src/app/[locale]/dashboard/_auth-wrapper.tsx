"use client";

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePrewarm } from "@/lib/queries/use-prewarm";
import { useCurrentOrg } from "@/lib/queries/use-organization";

/**
 * Auth wrapper that handles authentication, subscription guard, and query prewarm.
 * Prewarms common queries via prefetchQuery (populates React Query cache + IndexedDB).
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

  // Prewarm common queries for instant navigation + offline cache
  usePrewarm(orgInfo?.orgId);

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
