"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import {
  fetchVehiclePartPrice,
  usePriceHistory,
} from "@/lib/queries/use-wizard-data";
import type { PartsCatalogItem } from "@/lib/types";

export interface PartLine {
  part_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  final_price: number;
  last_price?: number;
}

export function usePartLines(
  orgId: string | undefined,
  vehicleMake: string | undefined,
  vehicleModel: string | undefined,
) {
  const [partLines, setPartLines] = useState<PartLine[]>([]);
  const [partHistory, setPartHistory] = useState<Record<string, number>>({});
  const [partsCatalog, setPartsCatalog] = useState<PartsCatalogItem[]>([]);
  const [vehiclePartPrices, setVehiclePartPrices] = useState<
    Record<string, number>
  >({});
  const vehiclePartsFetchedRef = useRef<Set<string>>(new Set());

  const { data: partsCatalogData, isInitialLoading: partsCatalogLoading } =
    usePartsCatalog(orgId);
  const { data: priceHistoryData } = usePriceHistory(orgId);

  useEffect(() => {
    if (partsCatalogData) setPartsCatalog(partsCatalogData);
  }, [partsCatalogData]);

  useEffect(() => {
    if (priceHistoryData) {
      setPartHistory(priceHistoryData.parts ?? {});
    }
  }, [priceHistoryData]);

  const addPartFromCatalog = useCallback(
    (part: PartsCatalogItem) => {
      const price = part.default_price ?? 0;
      const pname = part.name.toLowerCase();
      setPartLines((prev) => [
        ...prev,
        {
          part_name: part.name,
          part_number: part.part_number ?? "",
          quantity: 1,
          unit_price: price,
          final_price: price,
          last_price: undefined,
        },
      ]);
      if (orgId && vehicleMake && !vehiclePartsFetchedRef.current.has(pname)) {
        vehiclePartsFetchedRef.current.add(pname);
        void fetchVehiclePartPrice(
          orgId,
          part.name,
          vehicleMake,
          vehicleModel,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehiclePartPrices((prev) => ({
              ...prev,
              [pname]: vehiclePrice,
            }));
            setPartLines((prev) => {
              let idx = -1;
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].part_name.toLowerCase() === pname) {
                  idx = i;
                  break;
                }
              }
              if (idx === -1) return prev;
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                unit_price: vehiclePrice,
                final_price: vehiclePrice * updated[idx].quantity,
                last_price: vehiclePrice,
              };
              return updated;
            });
          }
        });
      }
    },
    [orgId, vehicleMake, vehicleModel],
  );

  const addPart = useCallback(() => {
    setPartLines((prev) => [
      ...prev,
      {
        part_name: "",
        part_number: "",
        quantity: 1,
        unit_price: 0,
        final_price: 0,
      },
    ]);
  }, []);

  const updatePart = useCallback(
    (idx: number, field: keyof PartLine, value: string | number) => {
      setPartLines((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        if (
          field === "part_name" &&
          typeof value === "string" &&
          value.trim()
        ) {
          const pname = value.trim().toLowerCase();
          const historyPrice = partHistory[pname];
          if (historyPrice && updated[idx].unit_price === 0) {
            updated[idx].unit_price = historyPrice;
            updated[idx].last_price = historyPrice;
          }
        }
        if (field === "quantity" || field === "unit_price") {
          updated[idx].final_price =
            Number(updated[idx].quantity) * Number(updated[idx].unit_price);
        }
        return updated;
      });
      if (
        field === "part_name" &&
        typeof value === "string" &&
        value.trim() &&
        orgId &&
        vehicleMake &&
        !vehiclePartsFetchedRef.current.has(value.trim().toLowerCase())
      ) {
        const pname = value.trim().toLowerCase();
        vehiclePartsFetchedRef.current.add(pname);
        void fetchVehiclePartPrice(
          orgId,
          value.trim(),
          vehicleMake,
          vehicleModel,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehiclePartPrices((prev) => ({
              ...prev,
              [pname]: vehiclePrice,
            }));
            setPartLines((prev) => {
              const idx = prev.findIndex(
                (p) => p.part_name.toLowerCase() === pname,
              );
              if (idx === -1) return prev;
              const updated = [...prev];
              if (updated[idx].unit_price === 0) {
                updated[idx].unit_price = vehiclePrice;
                updated[idx].final_price = vehiclePrice * updated[idx].quantity;
                updated[idx].last_price = vehiclePrice;
              }
              return updated;
            });
          }
        });
      }
    },
    [partHistory, orgId, vehicleMake, vehicleModel],
  );

  const removePart = useCallback(
    (idx: number) => setPartLines((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  return {
    partsCatalog,
    setPartsCatalog,
    partLines,
    setPartLines,
    partHistory,
    vehiclePartPrices,
    loading: partsCatalogLoading,
    addPartFromCatalog,
    addPart,
    updatePart,
    removePart,
  } as const;
}
