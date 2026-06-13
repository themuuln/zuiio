"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchVehicleServicePrice,
  usePriceHistory,
  useServiceCatalog,
} from "@/lib/queries/use-wizard-data";
import type { ServiceCatalog } from "@/lib/types";

export interface ServiceLine {
  service_catalog_id: string | null;
  name: string;
  base_price: number;
  quantity: number;
  discount_amount_mnt: number;
  discount_percent: number;
  final_price: number;
  last_price?: number;
}

export function useServiceLines(
  orgId: string | undefined,
  vehicleMake: string | undefined,
  vehicleModel: string | undefined,
) {
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Record<
      string,
      { last_price: number; last_make?: string; last_model?: string }
    >
  >({});
  const [vehicleServicePrices, setVehicleServicePrices] = useState<
    Record<string, number>
  >({});

  const { data: catalogData, isInitialLoading: catalogLoading } =
    useServiceCatalog(orgId);
  const { data: priceHistoryData, isInitialLoading: priceHistoryLoading } =
    usePriceHistory(orgId);

  useEffect(() => {
    if (catalogData) setCatalog(catalogData);
  }, [catalogData]);

  useEffect(() => {
    if (priceHistoryData) {
      setPriceHistory(priceHistoryData.services ?? {});
    }
  }, [priceHistoryData]);

  const addService = useCallback(
    (svc: ServiceCatalog) => {
      if (serviceLines.find((s) => s.service_catalog_id === svc.id)) return;
      const history = priceHistory[svc.id];
      const last = history?.last_price ?? Number(svc.default_price);
      setServiceLines((prev) => [
        ...prev,
        {
          service_catalog_id: svc.id,
          name: svc.name,
          base_price: last,
          quantity: 1,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: last,
          last_price: history ? last : undefined,
        },
      ]);
      if (orgId && vehicleMake) {
        void fetchVehicleServicePrice(
          orgId,
          svc.id,
          vehicleMake,
          vehicleModel,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehicleServicePrices((prev) => ({
              ...prev,
              [svc.id]: vehiclePrice,
            }));
            if (vehiclePrice !== last) {
              setServiceLines((prev) => {
                const idx = prev.findIndex(
                  (s) => s.service_catalog_id === svc.id,
                );
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  base_price: vehiclePrice,
                  final_price: vehiclePrice * updated[idx].quantity,
                  last_price: vehiclePrice,
                };
                return updated;
              });
            }
          }
        });
      }
    },
    [serviceLines, priceHistory, orgId, vehicleMake, vehicleModel],
  );

  const updateService = useCallback(
    (idx: number, field: keyof ServiceLine, value: number | string) => {
      setServiceLines((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        const s = updated[idx];
        const subtotal = Number(s.base_price) * Number(s.quantity);
        const discountMnt = Number(s.discount_amount_mnt);
        const discountPct = Number(s.discount_percent);
        updated[idx].final_price = Math.max(
          0,
          subtotal - discountMnt - (subtotal * discountPct) / 100,
        );
        return updated;
      });
    },
    [],
  );

  const removeService = useCallback(
    (idx: number) =>
      setServiceLines((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  return {
    catalog,
    setCatalog,
    serviceLines,
    setServiceLines,
    priceHistory,
    setPriceHistory,
    vehicleServicePrices,
    loading: catalogLoading || priceHistoryLoading,
    addService,
    updateService,
    removeService,
  } as const;
}
