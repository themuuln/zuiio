"use client";

import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { Input } from "@/components/ui/input";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useOrgVehicleModels,
  useServiceVehicleModels,
  useUpsertServiceVehicleModelPrice,
} from "@/lib/queries/use-service-vehicle-models";
import { formatMNT } from "@/lib/utils";

interface ServiceModelPricesSheetProps {
  serviceId: string | null;
  serviceName: string;
  defaultPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceModelPricesSheet({
  serviceId,
  serviceName,
  defaultPrice,
  open,
  onOpenChange,
}: ServiceModelPricesSheetProps) {
  const t = useTranslations("services");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: vehicleModels = [],
    isLoading: modelsLoading,
    isError: modelsError,
    error: modelsFetchError,
  } = useOrgVehicleModels(orgId);
  const {
    data: priceRows = [],
    isLoading: pricesLoading,
    isError: pricesError,
    error: pricesFetchError,
  } = useServiceVehicleModels(orgId, serviceId ?? undefined);

  const upsertMutation = useUpsertServiceVehicleModelPrice(
    orgId,
    serviceId ?? undefined,
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Local state ──
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [modelSearch, setModelSearch] = useState("");
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Build a lookup of existing prices
  const existingPriceMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const row of priceRows) {
      map[row.vehicle_model_id] = row.specific_price;
    }
    return map;
  }, [priceRows]);

  // Reset local state when sheet opens — useEffect, not useMemo
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const row of priceRows) {
        initial[row.vehicle_model_id] =
          row.specific_price != null ? String(row.specific_price) : "";
      }
      setLocalPrices(initial);
      setChangedIds(new Set());
      setModelSearch("");
      setShowConfirmDiscard(false);
      setPendingClose(false);
    }
  }, [open, priceRows]);

  // ── Group & filter models by make ──
  const modelsByMake = useMemo(() => {
    const q = modelSearch.toLowerCase();
    const filtered = q
      ? vehicleModels.filter(
          (vm) =>
            vm.make.toLowerCase().includes(q) ||
            vm.model.toLowerCase().includes(q),
        )
      : vehicleModels;

    const grouped: Record<string, Array<{ id: string; model: string }>> = {};
    for (const vm of filtered) {
      if (!grouped[vm.make]) grouped[vm.make] = [];
      grouped[vm.make].push({ id: vm.id, model: vm.model });
    }
    const sorted: Array<{
      make: string;
      models: Array<{ id: string; model: string }>;
    }> = [];
    for (const make of Object.keys(grouped).sort()) {
      grouped[make].sort((a, b) => a.model.localeCompare(b.model, locale));
      sorted.push({ make, models: grouped[make] });
    }
    return sorted;
  }, [vehicleModels, modelSearch, locale]);

  // Stats
  const customCount = useMemo(
    () => priceRows.filter((r) => r.specific_price != null).length,
    [priceRows],
  );

  // ── Actions ──
  const handlePriceChange = (vmId: string, value: string) => {
    setLocalPrices((prev) => ({ ...prev, [vmId]: value }));
    setChangedIds((prev) => new Set(prev).add(vmId));
  };

  const handleCloseAttempt = () => {
    if (changedIds.size > 0) {
      setShowConfirmDiscard(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmDiscard = () => {
    setShowConfirmDiscard(false);
    setChangedIds(new Set());
    if (pendingClose) {
      setPendingClose(false);
      onOpenChange(false);
    }
  };

  const setAllPrices = (price: number | null) => {
    const next: Record<string, string> = {};
    const nextChanged = new Set(changedIds);
    for (const vm of vehicleModels) {
      next[vm.id] = price != null ? String(price) : "";
      nextChanged.add(vm.id);
    }
    setLocalPrices((prev) => ({ ...prev, ...next }));
    setChangedIds(nextChanged);
  };

  const resetAll = () => {
    const next: Record<string, string> = {};
    const nextChanged = new Set(changedIds);
    for (const vm of vehicleModels) {
      next[vm.id] = "";
      nextChanged.add(vm.id);
    }
    setLocalPrices((prev) => ({ ...prev, ...next }));
    setChangedIds(nextChanged);
  };

  const handleSave = async () => {
    if (!orgId || !serviceId || changedIds.size === 0) return;

    // Batch all saves in parallel
    const results = await Promise.allSettled(
      Array.from(changedIds).map(async (vmId) => {
        const value = localPrices[vmId]?.trim();
        const specificPrice = value ? Number(value) : null;
        return upsertMutation.mutateAsync({
          vehicle_model_id: vmId,
          specific_price:
            specificPrice != null && !isNaN(specificPrice)
              ? specificPrice
              : null,
        });
      }),
    );

    const failures = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      toast.error(
        t("pricesFailed", { count: failures.length, total: changedIds.size }),
      );
      return;
    }

    toast.dismiss();
    toast.success(t("modelsUpdated", { count: changedIds.size }));
    setChangedIds(new Set());
  };

  const hasChanges = changedIds.size > 0;
  const isLoading = modelsLoading || pricesLoading;
  const totalModels = vehicleModels.length;

  // Determine error state
  const fetchError =
    modelsError || pricesError ? (modelsFetchError ?? pricesFetchError) : null;

  return (
    <>
      <DetailSheet open={open} onOpenChange={handleCloseAttempt} size="lg">
        <DetailSheet.Header bordered={false}>
          <div className="flex items-center justify-between">
            <SheetTitle>{t("modelSpecificPrices")}</SheetTitle>
            <Badge variant="secondary" className="shrink-0">
              {t("customCount", { count: customCount, total: totalModels })}
            </Badge>
          </div>
          <SheetDescription>
            {t("setDifferentPrices", { name: serviceName })}
            <br />
            {t("defaultPriceLabel")}{" "}
            <span className="font-medium tabular-nums">
              {formatMNT(defaultPrice)}
            </span>
            . {t("leaveEmptyDefault")}
          </SheetDescription>
        </DetailSheet.Header>

        {/* ── Search + Bulk Actions ── */}
        {!fetchError && (
          <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={t("searchMakesModels")}
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="pl-9 pr-8 h-9"
              />
              {modelSearch && (
                <button
                  type="button"
                  onClick={() => setModelSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                className="h-8 text-xs"
                onClick={() => setAllPrices(defaultPrice)}
                title={t("setAllDefault")}
              >
                {t("setAllDefault")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="h-8 text-xs"
                onClick={() => setAllPrices(0)}
                title={t("setAllZero")}
              >
                {t("setAllZero")}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="h-8 text-xs text-destructive"
                onClick={resetAll}
                title={t("resetAll")}
              >
                <RotateCcw className="size-3 mr-1" />
                {t("resetAll")}
              </Button>
            </div>
          </div>
        )}

        {/* ── Model List ── */}
        <DetailSheet.Body className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AlertTriangle className="size-8 text-destructive/60" />
              <Typography.Text className="text-destructive">
                {t("failedToLoad")}
              </Typography.Text>
              <Typography.Muted className="text-sm text-muted-foreground max-w-sm">
                {fetchError instanceof Error
                  ? fetchError.message
                  : t("unexpectedError")}
              </Typography.Muted>
            </div>
          ) : modelsByMake.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              {modelSearch ? (
                <>
                  <Search className="size-8 text-muted-foreground/40" />
                  <Typography.Muted className="text-muted-foreground">
                    {t("noModelsMatch", { search: modelSearch })}
                  </Typography.Muted>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-8 text-muted-foreground/40" />
                  <Typography.Muted className="text-muted-foreground">
                    {t("noModelsFound")}
                  </Typography.Muted>
                  <Typography.Muted className="text-sm text-muted-foreground">
                    {t("addModelsFirst")}
                  </Typography.Muted>
                </>
              )}
            </div>
          ) : (
            modelsByMake.map(({ make, models }) => (
              <div key={make}>
                <div className="flex items-center justify-between mb-1.5">
                  <Typography.Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {make}
                  </Typography.Text>
                  <span className="text-xs text-muted-foreground">
                    {models.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {models.map((vm) => {
                    const value = localPrices[vm.id] ?? "";
                    const existingPrice = existingPriceMap[vm.id];
                    const hasExisting = existingPrice != null;
                    const isChanged = changedIds.has(vm.id);

                    return (
                      <div
                        key={vm.id}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          isChanged
                            ? "border-primary/60 bg-primary/5"
                            : hasExisting
                              ? "border-border bg-muted/30"
                              : "border-border"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <Typography.Text className="text-sm font-medium truncate">
                            {vm.model}
                          </Typography.Text>
                          <div className="flex items-center gap-2">
                            {isChanged ? (
                              <Typography.Muted className="text-xs text-primary">
                                {t("willSave")}{" "}
                                {value
                                  ? formatMNT(Number(value))
                                  : t("willSaveDefault")}
                              </Typography.Muted>
                            ) : hasExisting ? (
                              <Typography.Muted className="text-xs text-muted-foreground">
                                {t("customPrice")} {formatMNT(existingPrice!)}
                              </Typography.Muted>
                            ) : (
                              <Typography.Muted className="text-xs text-muted-foreground">
                                {t("defaultPrice")} {formatMNT(defaultPrice)}
                              </Typography.Muted>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            placeholder={String(defaultPrice)}
                            value={value}
                            onChange={(e) =>
                              handlePriceChange(vm.id, e.target.value)
                            }
                            className={`h-8 w-24 text-right tabular-nums ${
                              isChanged ? "border-primary" : ""
                            }`}
                          />
                          {hasExisting && !isChanged && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setLocalPrices((prev) => ({
                                  ...prev,
                                  [vm.id]: "",
                                }));
                                setChangedIds((prev) =>
                                  new Set(prev).add(vm.id),
                                );
                              }}
                              aria-label={t("resetToDefault")}
                              title={t("resetToDefaultTitle")}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </DetailSheet.Body>

        {/* ── Footer ── */}
        <DetailSheet.Footer className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={handleCloseAttempt}
          >
            {t("cancel")}
          </Button>
          <Button
            className="flex-1 h-11"
            onClick={handleSave}
            disabled={!hasChanges || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="size-4" />
                {commonT("save")} {hasChanges ? `(${changedIds.size})` : ""}
              </>
            )}
          </Button>
        </DetailSheet.Footer>
      </DetailSheet>

      {/* ── Confirm Discard Dialog ── */}
      <AlertDialog
        open={showConfirmDiscard}
        onOpenChange={setShowConfirmDiscard}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {changedIds.size === 1
                ? t("discardDesc", { count: changedIds.size })
                : t("discardDescPlural", { count: changedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingClose(false)}>
              {t("keepEditing")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("discardChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
