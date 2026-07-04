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
  const { data: orgInfo, isPending } = useCurrentOrg();

  // usePrewarm must be called unconditionally before any early return (Rules of Hooks).
  // Its internal useEffect guards against undefined orgId and deduplicates.
  usePrewarm(orgInfo?.orgId);

  // Auth loading gate — wait for profile to be verified from the network.
  // Profile is never persisted to IndexedDB (see query-provider.tsx),
  // so isPending is true until the first successful network fetch.
  // This prevents a cascade of 401s from child components firing API
  // calls with a cached orgId before the session is confirmed valid.
  if (isPending) {
    return <AuthSkeleton />;
  }

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

/** Minimal skeleton shown while auth is being verified. */
function AuthSkeleton() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Verifying session…</p>
    </div>
  );
}
