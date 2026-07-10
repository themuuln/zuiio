"use client";

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { usePrewarm } from "@/lib/queries/use-prewarm";

/**
 * Auth wrapper that handles authentication, subscription guard, and query prewarm.
 * Prewarms common queries via prefetchQuery (populates React Query cache + IndexedDB).
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

  // usePrewarm must be called unconditionally before any early return (Rules of Hooks).
  // Its internal useEffect guards against undefined orgId and deduplicates.
  usePrewarm(orgInfo?.orgId);

  if (orgInfo) {
    return (
      <SubscriptionGuard
        orgId={orgInfo.orgId}
        orgName={orgInfo.orgName ?? "Organization"}
      >
        {children}
      </SubscriptionGuard>
    );
  }

  return <>{children}</>;
}
