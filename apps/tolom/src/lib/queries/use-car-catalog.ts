"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

export type NicheSettings = {
  enabled: boolean;
  brand_ids: string[];
  model_ids: string[];
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
// Niche-filtered variants
// ---------------------------------------------------------------------------

/**
 * Returns brands filtered by the org's vehicle niche settings.
 * If niche is disabled or absent, returns all brands.
 */
export function useFilteredCarBrands(
  orgSettings: Record<string, unknown> | undefined | null,
) {
  const { data: allBrands = [], ...rest } = useCarBrands();

  const niche = orgSettings?.vehicle_niche as NicheSettings | undefined;

  const filteredBrands = useMemo(() => {
    if (!niche?.enabled || niche.brand_ids.length === 0) {
      return allBrands;
    }
    return allBrands.filter((b) => niche.brand_ids.includes(b.id));
  }, [allBrands, niche]);

  return { data: filteredBrands, ...rest };
}

/**
 * Returns models filtered by the org's vehicle niche settings.
 * If niche is disabled, no model_ids are set, or brand not in niche, returns all models for the brand.
 */
export function useFilteredCarModels(
  brandId: string | null,
  orgSettings: Record<string, unknown> | undefined | null,
) {
  const { data: allModels = [], ...rest } = useCarModels(brandId);

  const niche = orgSettings?.vehicle_niche as NicheSettings | undefined;

  const filteredModels = useMemo(() => {
    if (!niche?.enabled) return allModels;
    // If brand not in niche brand_ids, return all (brand shouldn't appear,
    // but if it does somehow, don't filter models)
    if (
      niche.brand_ids.length > 0 &&
      brandId &&
      !niche.brand_ids.includes(brandId)
    ) {
      return allModels;
    }
    // If model_ids are set, filter to only those models
    if (niche.model_ids.length > 0) {
      return allModels.filter((m) => niche.model_ids.includes(m.id));
    }
    return allModels;
  }, [allModels, niche, brandId]);

  return { data: filteredModels, ...rest };
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
      const res = await fetch(
        `/api/smartcar/lookup?plate=${encodeURIComponent(plateNumber!)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      return json.data;
    },
    enabled: !!plateNumber && plateNumber.length >= 7,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
