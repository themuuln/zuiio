"use client";

import { useQuery } from "@tanstack/react-query";
import { SubscriptionExpiredDialog } from "./subscription-expired-dialog";
import type { SubscriptionStatus } from "@/lib/types";

interface Props {
  orgId: string;
  orgName: string;
  children: React.ReactNode;
}

export function SubscriptionGuard({ orgId, orgName, children }: Props) {
  const { data: status } = useQuery({
    queryKey: ["subscription-status", orgId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/subscription/status`,
      );
      if (!res.ok) return null;
      const body = await res.json();
      return (body.data as SubscriptionStatus) ?? null;
    },
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  });

  const blocked = status?.expired === true;

  return (
    <>
      {blocked && (
        <SubscriptionExpiredDialog
          orgId={orgId}
          orgName={orgName}
          subscriptionStatus={status}
        />
      )}
      {children}
    </>
  );
}
