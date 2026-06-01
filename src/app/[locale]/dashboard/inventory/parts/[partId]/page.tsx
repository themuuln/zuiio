"use client";

import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useInventoryBalances,
  useInventoryMovements,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { DetailsForm } from "./_details-form";
import { PartHeader } from "./_header";
import { StockHistory } from "./_stock-history";
import { ThresholdCard } from "./_threshold-card";

export default function PartDetailPage() {
  const t = useTranslations("inventory");
  const commonT = useTranslations("common");
  const params = useParams();
  const partId = params.partId as string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? null;

  const {
    data: parts = [],
    isLoading: partsLoading,
    error: partsError,
  } = usePartsCatalog(orgId ?? undefined);
  const { data: balances = [], isLoading: balancesLoading } =
    useInventoryBalances(orgId ?? undefined);
  const { data: movements = [], isLoading: movementsLoading } =
    useInventoryMovements(orgId ?? undefined);
  const { data: thresholds = [], isLoading: thresholdsLoading } =
    useStockThresholds(orgId ?? undefined);

  const part = useMemo(
    () => parts.find((p) => p.id === partId),
    [parts, partId],
  );
  const balance = useMemo(
    () => balances.find((b) => b.part_id === partId),
    [balances, partId],
  );
  const threshold = useMemo(
    () => thresholds.find((t) => t.part_id === partId),
    [thresholds, partId],
  );
  const partMovements = useMemo(
    () =>
      movements
        .filter((m) => m.part_id === partId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [movements, partId],
  );

  const onHand = balance?.quantity_on_hand ?? 0;
  const minThreshold = threshold?.minimum_quantity ?? 5;

  // Loading state
  const isLoading =
    (partsLoading && parts.length === 0) ||
    (balancesLoading && balances.length === 0);

  if (!orgId) return null;

  // Part not found (loaded data but part doesn't exist)
  if (!isLoading && !partsError && parts.length > 0 && !part) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="size-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">{t("partNotFound")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("partNotFoundDescription")}
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          {t("backToInventory")}
        </Button>
      </div>
    );
  }

  // Error state
  if (partsError && parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="size-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load part data.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {commonT("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PartHeader
        part={part}
        onHand={onHand}
        minThreshold={minThreshold}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Stock History */}
        <div className="lg:col-span-2">
          <StockHistory
            movements={partMovements}
            isLoading={movementsLoading}
          />
        </div>

        {/* Right column: Threshold + Details */}
        <div className="flex flex-col gap-6">
          <ThresholdCard
            orgId={orgId}
            partId={partId}
            currentMinimum={minThreshold}
            onHand={onHand}
            isLoading={thresholdsLoading}
          />
          {part && <DetailsForm part={part} />}
        </div>
      </div>
    </div>
  );
}
