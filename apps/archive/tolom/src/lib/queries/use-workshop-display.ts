import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DisplayWorkOrder } from "@/app/api/organizations/[id]/display/work-orders/route";
import { createOrgQuery } from "./factory";
import { workshopDisplayKeys } from "./keys";

const fetchDisplayWorkOrders = createOrgQuery<DisplayWorkOrder[]>(
  "/display/work-orders",
);

export function useWorkshopDisplay(
  orgId: string | undefined,
): UseQueryResult<DisplayWorkOrder[], Error> {
  return useQuery({
    queryKey: workshopDisplayKeys.workOrders(orgId ?? ""),
    queryFn: () => fetchDisplayWorkOrders(orgId ?? ""),
    enabled: !!orgId,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 2,
  });
}
