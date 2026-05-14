import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { workOrderKeys } from "./keys";

export interface WorkOrderListItem {
  id: string;
  status: string;
  created_at: string;
  mechanic_id: string | null;
  customer: { first_name: string; last_name: string | null } | null;
  vehicle: { plate_number: string } | null;
  grand_total?: number;
}

export function useWorkOrders(
  orgId: string | undefined,
  status = "",
  search = "",
): UseQueryResult<WorkOrderListItem[], Error> {
  return useQuery({
    queryKey: [...workOrderKeys.list(orgId ?? "", status), search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const qs = params.toString();
      const url = `/api/organizations/${orgId}/work-orders${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load work orders");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as WorkOrderListItem[];
    },
    enabled: !!orgId,
    staleTime: 15_000,
  });
}
