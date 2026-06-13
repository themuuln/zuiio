"use client";

import { AlertCircle, Dices } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PartForm } from "@/components/inventory/part-form";
import { VariantEditorSheet } from "@/components/services/variant-editor-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useItemVariants } from "@/lib/queries/use-catalog-variants";
import {
  useInventoryBalances,
  useInventoryMovements,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
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
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const [showVariants, setShowVariants] = useState(false);

  const { data: variants = [] } = useItemVariants(
    orgId ?? undefined,
    "part",
    partId,
  );

  const {
    data: parts = [],
    isLoading: partsLoading,
    error: partsError,
  } = usePartsCatalog(orgId ?? undefined, branchFilter);
  const { data: balances = [], isLoading: balancesLoading } =
    useInventoryBalances(orgId ?? undefined, branchFilter);
  const { data: movements = [], isLoading: movementsLoading } =
    useInventoryMovements(orgId ?? undefined, undefined, branchFilter);
  const { data: thresholds = [], isLoading: thresholdsLoading } =
    useStockThresholds(orgId ?? undefined, branchFilter);

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

        {/* Right column: Threshold + Details + Variants */}
        <div className="flex flex-col gap-6">
          <ThresholdCard
            orgId={orgId}
            partId={partId}
            currentMinimum={minThreshold}
            onHand={onHand}
            isLoading={thresholdsLoading}
          />
          {part && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {t("editPartDetails")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setShowVariants(true)}
                >
                  <Dices className="size-4" />
                  {t("manageVariants")}
                  {variants.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {variants.length}
                    </Badge>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <PartForm
                  partId={part.id}
                  initialData={{
                    name: part.name,
                    name_mn: part.name_mn ?? undefined,
                    part_number: part.part_number ?? undefined,
                    category: part.category ?? undefined,
                    description: part.description ?? undefined,
                    unit: part.unit ?? undefined,
                    default_price: part.default_price ?? undefined,
                    image_url: part.image_url ?? undefined,
                    location: part.location ?? undefined,
                  }}
                  onSuccess={() => {}}
                  onCancel={undefined}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Variant Editor */}
      <VariantEditorSheet
        entityType="part"
        entityId={part?.id ?? null}
        entityName={part?.name ?? ""}
        defaultPrice={part?.default_price ?? 0}
        open={showVariants}
        onOpenChange={setShowVariants}
      />
    </div>
  );
}
