"use client";

import { useQuery } from "@tanstack/react-query";

export type CarBrand = {
  id: string;
  name: string;
  country: string | null;
  is_active: boolean;
};

export type CarModel = {
  id: string;
  name: string;
  body_type: string | null;
  fuel_type: string | null;
  transmission: string | null;
  drivetrain: string | null;
  year_start: number | null;
  year_end: number | null;
  engine_options: string | null;
  is_active: boolean;
};

export const carCatalogKeys = {
  all: ["car-catalog"] as const,
  brands: () => [...carCatalogKeys.all, "brands"] as const,
  models: (brandId: string) =>
    [...carCatalogKeys.all, "models", brandId] as const,
};

export function useCarBrands() {
  return useQuery({
    queryKey: carCatalogKeys.brands(),
    queryFn: async (): Promise<CarBrand[]> => {
      const res = await fetch("/api/car-brands");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message ?? "Failed to fetch brands");
      return json.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — brands rarely change
  });
}

export function useCarModels(brandId: string | null) {
  return useQuery({
    queryKey: carCatalogKeys.models(brandId ?? ""),
    queryFn: async (): Promise<CarModel[]> => {
      const res = await fetch(`/api/car-brands/${brandId}/models`);
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message ?? "Failed to fetch models");
      return json.data;
    },
    enabled: !!brandId,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// ---------------------------------------------------------------------------
// SmartCar plate lookup
// ---------------------------------------------------------------------------

export type SmartCarLookupData = {
  plateNumber: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  category: string;
  engineCc: number | null;
  transmission: string;
  fuelType: string;
  steering: string;
  seats: number | null;
  bodyType: string;
  country: string;
  color: string;
  height: string;
  width: string;
  length: string;
  weight: string;
  importDate: string;
};

export function useSmartCarLookup(plateNumber: string | null) {
  return useQuery({
    queryKey: ["smartcar-lookup", plateNumber],
    queryFn: async (): Promise<SmartCarLookupData> => {
      const res = await fetch(`/api/smartcar/lookup?plate=${encodeURIComponent(plateNumber!)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      return json.data;
    },
    enabled: !!plateNumber && plateNumber.length >= 7,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
