"use client";

import {
  AlertCircle,
  Dices,
  PackagePlus,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PartForm } from "@/components/inventory/part-form";
import { PartImagesGallery } from "@/components/inventory/part-images-gallery";
import { QuickStockInDialog } from "@/components/inventory/quick-stock-in-dialog";
import { ReturnToSupplierDialog } from "@/components/inventory/return-to-supplier-dialog";
import { VariantEditorDrawer } from "@/components/services/variant-editor-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useItemVariants } from "@/lib/queries/use-catalog-variants";
import {
  useInventoryBalances,
  useInventoryMovements,
  usePartsCatalog,
  useStockThresholds,
  useSupplierPriceHistory,
  useVehicleModelParts,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { PartHeader } from "./_header";
import { StockHistory } from "./_stock-history";
import { SupplierPriceHistory } from "./_supplier-price-history";
import { ThresholdCard } from "./_threshold-card";
import { VehicleFitment } from "./_vehicle-fitment";

export default function PartDetailPage() {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const params = useParams();
  const partId = params.partId as string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? null;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const [showVariants, setShowVariants] = useState(false);
  const [showQuickStockIn, setShowQuickStockIn] = useState(false);
  const [showReturnToSupplier, setShowReturnToSupplier] = useState(false);

  const { data: variants = [] } = useItemVariants(
    orgId ?? undefined,
    "part",
    partId,
  );

  const {
    data: parts = [],
    isPending: partsLoading,
    error: partsError,
  } = usePartsCatalog(orgId ?? undefined, branchFilter);
  const { data: balances = [], isPending: balancesLoading } =
    useInventoryBalances(orgId ?? undefined, branchFilter);
  const { data: movements = [], isPending: movementsLoading } =
    useInventoryMovements(orgId ?? undefined, undefined, branchFilter);
  const { data: fitments = [], isPending: fitmentsLoading } =
    useVehicleModelParts(orgId ?? undefined, partId);
  const { data: priceHistory = [], isPending: priceHistoryLoading } =
    useSupplierPriceHistory(orgId ?? undefined, partId);
  const { data: thresholds = [], isPending: thresholdsLoading } =
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

  // Loading state — show skeletons until parts are loaded AND we've found the specific part
  const isPending =
    (partsLoading && parts.length === 0) ||
    (balancesLoading && balances.length === 0) ||
    (parts.length > 0 && !part && !partsError);

  if (!orgId) return null;

  // Part not found (loaded data but part doesn't exist)
  if (!isPending && !partsError && parts.length > 0 && !part) {
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
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6">
      {/* Print-only shelf label */}
      <div className="print-only">
        {part && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl font-bold mb-2">{part.name}</div>
            {part.name_mn && (
              <div className="text-2xl text-gray-600 mb-4">{part.name_mn}</div>
            )}
            <div className="text-xl mb-2">
              {t("partNumber")}: {part.part_number}
            </div>
            <div className="text-lg mb-1">{part.category}</div>
            <div className="text-lg">
              {onHand} {part.unit}
            </div>
            <div className="text-lg mt-2">
              {part.default_price?.toLocaleString()}
            </div>
          </div>
        )}
      </div>
      <style>{`@media print{body *{visibility:hidden}.print-only,.print-only *{visibility:visible}.print-only{position:absolute;left:0;top:0;width:100%}}@media screen{.print-only{display:none}}`}</style>
      <PartHeader
        part={part}
        onHand={onHand}
        minThreshold={minThreshold}
        isPending={isPending}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Stock History + Price History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <StockHistory
            movements={partMovements}
            isPending={movementsLoading}
          />
          <SupplierPriceHistory
            history={priceHistory}
            isPending={priceHistoryLoading}
          />
        </div>

        {/* Right column: Threshold + Fitment + Details + Actions */}
        <div className="flex flex-col gap-6">
          <ThresholdCard
            orgId={orgId}
            partId={partId}
            currentMinimum={minThreshold}
            onHand={onHand}
            isPending={thresholdsLoading}
          />

          {/* Part Images Gallery */}
          {orgId && <PartImagesGallery orgId={orgId} partId={partId} />}

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setShowQuickStockIn(true)}
            >
              <PackagePlus className="size-4" />
              {t("quickStockIn")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setShowReturnToSupplier(true)}
            >
              <RotateCcw className="size-4" />
              {t("returnToSupplier")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              {t("printLabel")}
            </Button>
          </div>

          <VehicleFitment fitments={fitments} isPending={fitmentsLoading} />

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
                    purchase_price: part.purchase_price ?? undefined,
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
      <VariantEditorDrawer
        entityType="part"
        entityId={part?.id ?? null}
        entityName={part?.name ?? ""}
        defaultPrice={part?.default_price ?? 0}
        open={showVariants}
        onOpenChange={setShowVariants}
      />

      {/* Quick Stock In Dialog */}
      {orgId && (
        <QuickStockInDialog
          open={showQuickStockIn}
          onOpenChange={setShowQuickStockIn}
          orgId={orgId}
          branchId={branchFilter}
          preselectedPartId={partId}
        />
      )}

      {/* Return to Supplier Dialog */}
      {orgId && (
        <ReturnToSupplierDialog
          open={showReturnToSupplier}
          onOpenChange={setShowReturnToSupplier}
          orgId={orgId}
          branchId={branchFilter}
          preselectedPartId={partId}
        />
      )}
    </div>
  );
}
