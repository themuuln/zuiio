"use client";

import { useQuery } from "@tanstack/react-query";
import { SubscriptionExpiredDialog } from "./subscription-expired-dialog";

interface Props {
  orgId: string;
  orgName: string;
  children: React.ReactNode;
}

export function SubscriptionGuard({ orgId, orgName, children }: Props) {
  const { data: expired } = useQuery({
    queryKey: ["subscription-status", orgId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/subscription/status`,
      );
      if (!res.ok) return false;
      const body = await res.json();
      return (body.data as { expired?: boolean })?.expired === true;
    },
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  });

  return (
    <>
      {expired && (
        <SubscriptionExpiredDialog orgId={orgId} orgName={orgName} />
      )}
      {children}
    </>
  );
}
