"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Car,
  CarFront,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import {
  type CarBrand,
  type CarModel,
  carCatalogKeys,
} from "@/lib/queries/use-car-catalog";
import type { Organization } from "@/lib/types";
import { SettingsBlock, SettingsGroup, SettingsRow } from "./_settings-layout";

interface VehicleNicheFormProps {
  organization: Organization | undefined;
  onRefetch: () => void;
}

type NicheSettings = {
  enabled: boolean;
  brand_ids: string[];
  model_ids: string[];
};

const DEFAULT_NICHE: NicheSettings = {
  enabled: false,
  brand_ids: [],
  model_ids: [],
};

function readNiche(org: Organization | undefined): NicheSettings {
  if (!org?.settings) return DEFAULT_NICHE;
  const s = org.settings as Record<string, unknown>;
  const niche = s.vehicle_niche as Partial<NicheSettings> | undefined;
  return {
    enabled: niche?.enabled ?? false,
    brand_ids: niche?.brand_ids ?? [],
    model_ids: niche?.model_ids ?? [],
  };
}

export function VehicleNicheForm({
  organization,
  onRefetch,
}: VehicleNicheFormProps) {
  const t = useTranslations("settings");
  const [niche, setNiche] = useState<NicheSettings>(DEFAULT_NICHE);
  const [saving, setSaving] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  // Initialize from org settings
  useEffect(() => {
    if (organization) {
      setNiche(readNiche(organization));
    }
  }, [organization]);

  // Fetch all brands (unfiltered — we show all for selection)
  const { data: allBrands = [], isLoading: brandsLoading } = useQuery({
    queryKey: carCatalogKeys.brands(),
    queryFn: async (): Promise<CarBrand[]> => {
      const res = await fetch("/api/car-brands");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message ?? "Failed to fetch brands");
      return json.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Fetch models for expanded brands
  const expandedBrandIds = useMemo(
    () => [...expandedBrands].filter((id) => niche.brand_ids.includes(id)),
    [expandedBrands, niche.brand_ids],
  );

  const brandModelsQueries = useQueries({
    queries: expandedBrandIds.map((brandId) => ({
      queryKey: carCatalogKeys.models(brandId),
      queryFn: async (): Promise<CarModel[]> => {
        const res = await fetch(`/api/car-brands/${brandId}/models`);
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error?.message ?? "Failed to fetch models");
        return json.data;
      },
      staleTime: 1000 * 60 * 60 * 24,
    })),
  });

  const modelsByBrand = useMemo(() => {
    const map: Record<string, CarModel[]> = {};
    for (const [index, query] of brandModelsQueries.entries()) {
      const brandId = expandedBrandIds[index];
      if (brandId && query.data) map[brandId] = query.data;
    }
    return map;
  }, [brandModelsQueries, expandedBrandIds]);

  const toggleBrand = useCallback((brandId: string) => {
    setNiche((prev) => {
      const has = prev.brand_ids.includes(brandId);
      const nextBrandIds = has
        ? prev.brand_ids.filter((id) => id !== brandId)
        : [...prev.brand_ids, brandId];
      return { ...prev, brand_ids: nextBrandIds };
    });
  }, []);

  const selectAllBrands = useCallback(() => {
    setNiche((prev) => ({
      ...prev,
      brand_ids: allBrands.map((brand) => brand.id),
    }));
  }, [allBrands]);

  const invertBrands = useCallback(() => {
    setNiche((prev) => {
      const selected = new Set(prev.brand_ids);
      const nextBrandIds = allBrands
        .filter((brand) => !selected.has(brand.id))
        .map((brand) => brand.id);

      return {
        ...prev,
        brand_ids: nextBrandIds,
        model_ids: [],
      };
    });
  }, [allBrands]);

  const toggleModel = useCallback((modelId: string) => {
    setNiche((prev) => {
      const has = prev.model_ids.includes(modelId);
      return {
        ...prev,
        model_ids: has
          ? prev.model_ids.filter((id) => id !== modelId)
          : [...prev.model_ids, modelId],
      };
    });
  }, []);

  const toggleAllModelsForBrand = useCallback(
    (modelIds: string[], select: boolean) => {
      setNiche((prev) => {
        if (select) {
          const merged = new Set([...prev.model_ids, ...modelIds]);
          return { ...prev, model_ids: [...merged] };
        }
        return {
          ...prev,
          model_ids: prev.model_ids.filter((id) => !modelIds.includes(id)),
        };
      });
    },
    [],
  );

  const toggleExpandBrand = useCallback((brandId: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const currentSettings =
        (organization.settings as Record<string, unknown>) ?? {};
      const nextSettings = {
        ...currentSettings,
        vehicle_niche: {
          enabled: niche.enabled,
          brand_ids: niche.brand_ids,
          model_ids: niche.model_ids,
        },
      };

      const res = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: nextSettings }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(
          json.error?.message ?? "Failed to save vehicle niche settings",
        );
      }

      onRefetch();
      toast.success(t("nicheSavedToast"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [organization, niche, onRefetch, t]);

  if (!organization) {
    return (
      <SettingsBlock>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-8 w-24" />
      </SettingsBlock>
    );
  }

  return (
    <SettingsBlock>
      <SettingsGroup>
        <SettingsRow
          label="Show only specific vehicle brands"
          description="Choose the vehicle brands and models your workshop works on. Only selected brands will appear in vehicle creation, work orders, and the parts catalog."
        >
          <Switch
            checked={niche.enabled}
            onCheckedChange={(checked) =>
              setNiche((prev) => ({ ...prev, enabled: checked }))
            }
            disabled={saving}
          />
        </SettingsRow>
      </SettingsGroup>

      {niche.enabled ? (
        <>
          <Separator />

          {/* Summary badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Car className="size-3" />
              {niche.brand_ids.length} brand
              {niche.brand_ids.length !== 1 && "s"}
            </Badge>
            {niche.model_ids.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CarFront className="size-3" />
                {niche.model_ids.length} model
                {niche.model_ids.length !== 1 && "s"}
              </Badge>
            )}
            {niche.brand_ids.length === 0 && (
              <Typography.Muted className="text-xs">
                Select brands below to restrict your workshop
              </Typography.Muted>
            )}
          </div>

          {/* Brand selection */}
          <div className="flex flex-col gap-2">
            <Typography.Text className="text-sm font-medium">
              Vehicle Brands
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground">
              Select the brands your workshop services. Expand a brand to narrow
              it down to specific models.
            </Typography.Muted>

            {brandsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allBrands.length === 0 ? (
              <Typography.Muted className="py-4 text-center text-sm">
                No vehicle brands found in the catalog
              </Typography.Muted>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <div className="flex flex-col gap-1">
                  {allBrands.map((brand) => (
                    <BrandRow
                      key={brand.id}
                      brand={brand}
                      selected={niche.brand_ids.includes(brand.id)}
                      expanded={expandedBrands.has(brand.id)}
                      models={modelsByBrand[brand.id]}
                      modelsLoading={
                        expandedBrands.has(brand.id) && !modelsByBrand[brand.id]
                      }
                      selectedModelIds={niche.model_ids}
                      onToggleBrand={toggleBrand}
                      onToggleExpand={toggleExpandBrand}
                      onToggleModel={toggleModel}
                      onToggleAllModels={toggleAllModelsForBrand}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Quick actions */}
          {allBrands.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllBrands}
                disabled={saving}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={invertBrands}
                disabled={saving}
              >
                Invert
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setNiche((prev) => ({
                    ...prev,
                    brand_ids: [],
                    model_ids: [],
                  }))
                }
                disabled={saving}
              >
                Clear all
              </Button>
            </div>
          )}
        </>
      ) : null}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wrench className="size-4" />
          )}
          {saving ? "Saving..." : "Save niche settings"}
        </Button>
      </div>

      {/* Info alert */}
      <Alert variant="default">
        <Info className="size-4" />
        <AlertTitle>{t("howNicheWorks")}</AlertTitle>
        <AlertDescription>{t("vehicleNicheDetails")}</AlertDescription>
      </Alert>
    </SettingsBlock>
  );
}

// ─── Brand Row ──────────────────────────────────────────────────────────

function BrandRow({
  brand,
  selected,
  expanded,
  models,
  modelsLoading,
  selectedModelIds,
  onToggleBrand,
  onToggleExpand,
  onToggleModel,
  onToggleAllModels,
}: {
  brand: CarBrand;
  selected: boolean;
  expanded: boolean;
  models: CarModel[] | undefined;
  modelsLoading: boolean;
  selectedModelIds: string[];
  onToggleBrand: (brandId: string) => void;
  onToggleExpand: (brandId: string) => void;
  onToggleModel: (modelId: string) => void;
  onToggleAllModels: (modelIds: string[], select: boolean) => void;
}) {
  const selectedModelCount = models
    ? models.filter((m) => selectedModelIds.includes(m.id)).length
    : 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/50">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleBrand(brand.id)}
          id={`brand-${brand.id}`}
        />
        <label
          htmlFor={`brand-${brand.id}`}
          className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium"
        >
          {brand.name}
          {brand.country && (
            <span className="text-xs text-muted-foreground">
              ({brand.country})
            </span>
          )}
        </label>

        {selected && (
          <>
            {selectedModelCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedModelCount} model
                {selectedModelCount !== 1 && "s"}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onToggleExpand(brand.id)}
            >
              {expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Expanded model list */}
      {selected && expanded && (
        <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-muted pl-3">
          {modelsLoading ? (
            <div className="flex flex-col gap-1 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !models || models.length === 0 ? (
            <Typography.Muted className="py-2 text-xs">
              No models found for {brand.name}
            </Typography.Muted>
          ) : (
            <>
              <div className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={
                    models.length > 0 &&
                    models.every((m) => selectedModelIds.includes(m.id))
                  }
                  onCheckedChange={() => {
                    const allSelected = models.every((m) =>
                      selectedModelIds.includes(m.id),
                    );
                    onToggleAllModels(
                      models.map((m) => m.id),
                      !allSelected,
                    );
                  }}
                  id={`brand-all-models-${brand.id}`}
                />
                <label
                  htmlFor={`brand-all-models-${brand.id}`}
                  className="cursor-pointer text-xs font-medium text-muted-foreground"
                >
                  All models
                </label>
              </div>
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/50"
                >
                  <Checkbox
                    checked={selectedModelIds.includes(model.id)}
                    onCheckedChange={() => onToggleModel(model.id)}
                    id={`model-${model.id}`}
                  />
                  <label
                    htmlFor={`model-${model.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {model.name}
                    {model.year_start && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({model.year_start}
                        {model.year_end ? `-${model.year_end}` : "+"})
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
