"use client";

import { useCallback, useEffect, useState } from "react";
import { useVehicleSearch } from "@/lib/queries/use-wizard-data";
import type { Vehicle } from "@/lib/types";

export function useVehicleSelection(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);

  const { data: vehicleSearchResults, isFetching: vehicleSearchFetching } =
    useVehicleSearch(orgId, customerId, vehicleSearch);

  useEffect(() => {
    if (!vehicleSearch && !customerId) {
      setVehicles([]);
    } else {
      setVehicles(vehicleSearchResults ?? []);
    }
  }, [vehicleSearchResults, vehicleSearch, customerId]);

  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleSearch("");
    setShowQuickVehicle(false);
  }, []);

  return {
    vehicleSearch,
    setVehicleSearch,
    vehicles,
    setVehicles,
    selectedVehicle,
    setSelectedVehicle,
    showQuickVehicle,
    setShowQuickVehicle,
    vehicleSearching: vehicleSearchFetching,
    handleSelectVehicle,
  } as const;
}
