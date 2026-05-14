"use client";

import { useEffect } from "react";
import type { ServiceCatalog } from "@/lib/types";
import type { MechanicOption } from "@/lib/queries/use-wizard-data";

interface UseInitialDataParams {
  setOrgId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setCatalog: (catalog: ServiceCatalog[]) => void;
  setMechanics: (mechanics: MechanicOption[]) => void;
  setPriceHistory: (
    history: Record<
      string,
      { last_price: number; last_make?: string; last_model?: string }
    >,
  ) => void;
  setPartHistory: (history: Record<string, number>) => void;
}

export function useInitialData({
  setOrgId,
  setLoading,
  setCatalog,
  setMechanics,
  setPriceHistory,
  setPartHistory,
}: UseInitialDataParams) {
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          setOrgId(id);
          Promise.all([
            fetch(`/api/organizations/${id}/services`).then((r) => r.json()),
            fetch(`/api/organizations/${id}/reports?type=mechanics`).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/price-history`).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/work-orders`).then((r) => r.json()),
          ]).then(([catJson, mechJson, priceJson, workOrdersJson]) => {
            if (catJson.data) setCatalog(catJson.data);
            const mechanicsList = mechJson.data;
            if (Array.isArray(mechanicsList)) {
              const activeWorkOrders = (workOrdersJson.data ?? []).filter(
                (wo: { status: string }) =>
                  [
                    "New",
                    "Diagnosing",
                    "In Progress",
                    "Ready for Pickup",
                  ].includes(wo.status),
              );
              setMechanics(
                mechanicsList.map(
                  (mechanic: { id: string; full_name: string | null }) => ({
                    id: mechanic.id,
                    fullName: mechanic.full_name ?? null,
                    email: "",
                    current_jobs: activeWorkOrders.filter(
                      (wo: { mechanic_id: string | null }) =>
                        wo.mechanic_id === mechanic.id,
                    ).length,
                  }),
                ),
              );
            }
            if (priceJson.data) {
              setPriceHistory(priceJson.data.services ?? {});
              setPartHistory(priceJson.data.parts ?? {});
            }
          });
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [
    setOrgId,
    setLoading,
    setCatalog,
    setMechanics,
    setPriceHistory,
    setPartHistory,
  ]);
}
