"use client";

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";

/**
 * Auth wrapper that handles authentication and subscription guard.
 * This is the only client boundary needed for auth-dependent layouts.
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

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
