import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createOrgQuery } from "./factory";
import { workOrderKeys } from "./keys";

export interface WorkOrderListItem {
  id: string;
  status: string;
  created_at: string;
  mechanic_id: string | null;
  mechanic: { full_name: string | null } | null;
  customer: { first_name: string; last_name: string | null } | null;
  vehicle: {
    plate_number: string;
    make: string | null;
    model: string | null;
  } | null;
  grand_total?: number;
  services_cost?: number;
  parts_cost?: number;
  services_revenue?: number;
  parts_revenue?: number;
  gross_profit?: number;
  margin_percent?: number;
}

const fetchWorkOrders = createOrgQuery<WorkOrderListItem[]>("/work-orders");

export function useWorkOrders(
  orgId: string | undefined,
  status = "",
  search = "",
): UseQueryResult<WorkOrderListItem[], Error> {
  return useQuery({
    queryKey: [...workOrderKeys.list(orgId ?? "", status), search],
    queryFn: () =>
      fetchWorkOrders(orgId!, {
        params: {
          ...(status ? { status } : {}),
          ...(search ? { q: search } : {}),
        },
      }),
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  });
}
