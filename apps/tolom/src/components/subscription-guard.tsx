"use client";

import { useQuery } from "@tanstack/react-query";
import type { SubscriptionStatus } from "@/lib/types";
import { SubscriptionExpiredDialog } from "./subscription-expired-dialog";

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
    refetchInterval: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 120_000,
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
