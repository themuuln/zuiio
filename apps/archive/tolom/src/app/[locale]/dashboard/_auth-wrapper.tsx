"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { usePrewarm } from "@/lib/queries/use-prewarm";
import { useSetOrgId } from "@/lib/stores";

/**
 * Auth wrapper that handles authentication, subscription guard, and query prewarm.
 * Prewarms common queries via prefetchQuery (populates React Query cache + IndexedDB).
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();
  const setOrgId = useSetOrgId();

  useEffect(() => {
    if (orgInfo?.orgId) {
      setOrgId(orgInfo.orgId);
    }
  }, [orgInfo?.orgId, setOrgId]);
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
