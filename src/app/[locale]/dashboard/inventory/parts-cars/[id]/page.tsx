"use client";

import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Cpu,
  Fan,
  Fuel,
  Gauge,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Thermometer,
  Trash2,
  Wind,
  Wrench,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import {
  useAddPartsCarPart,
  useCompleteDisassembly,
  usePartsCar,
  usePartsCarParts,
  usePublishPartsCarToCatalog,
  useRemovePartsCarPart,
  useStartDisassembly,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PartsCarLocationGroup } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

const _STATUS_BADGE_COLORS: Record<string, string> = {
  arrived: "bg-blue-100 text-blue-700",
  disassembling: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const _LOCATION_GROUPS: PartsCarLocationGroup[] = [
  "engine",
  "transmission",
  "suspension",
  "brake",
  "body",
  "interior",
  "electrical",
  "cooling",
  "exhaust",
  "fuel",
  "steering",
  "ac",
  "other",
];

const LOCATION_GROUP_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  engine: Cpu,
  transmission: Gauge,
  suspension: Wrench,
  brake: RotateCcw,
  body: Car,
  interior: Package,
  electrical: Cpu,
  cooling: Thermometer,
  exhaust: Wind,
  fuel: Fuel,
  steering: Gauge,
  ac: Fan,
  other: Package,
};

export default function PartsCarDetailPage() {
  const t = useTranslations("partsCars");
  const params = useParams<{ id: string }>();
  const carId = params.id;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: car, isLoading: carLoading } = usePartsCar(orgId, carId);
  const { data: parts = [], isLoading: partsLoading } = usePartsCarParts(
    orgId,
    carId,
  );

  const startDisassembly = useStartDisassembly(orgId);
  const completeDisassembly = useCompleteDisassembly(orgId);
  const publishToCatalog = usePublishPartsCarToCatalog(orgId);
  const addPart = useAddPartsCarPart(orgId);
  const removePart = useRemovePartsCarPart(orgId);

  const [partName, setPartName] = useState("");
  const [partLocation, setPartLocation] =
    useState<PartsCarLocationGroup>("other");
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState(0);
  const [adding, setAdding] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleStart = useCallback(async () => {
    try {
      await startDisassembly.mutateAsync(carId);
      toast.success(t("toast.started"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.startError"));
    }
  }, [startDisassembly, carId, t]);

  const handleComplete = useCallback(async () => {
    if (!confirm(t("toast.completeConfirm"))) return;
    try {
      await completeDisassembly.mutateAsync(carId);
      toast.success(t("toast.completed"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("toast.completeError"),
      );
    }
  }, [completeDisassembly, carId, t]);

  const handleAddPart = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!partName.trim()) {
        toast.error("Please enter a part name");
        return;
      }
      setAdding(true);
      try {
        await addPart.mutateAsync({
          carId,
          name: partName.trim(),
          location_group: partLocation,
          quantity: partQty,
          estimated_price: partPrice,
        });
        setPartName("");
        setPartQty(1);
        setPartPrice(0);
        nameInputRef.current?.focus();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("toast.addError"));
      } finally {
        setAdding(false);
      }
    },
    [addPart, carId, partName, partLocation, partQty, partPrice, t],
  );

  const handleRemovePart = useCallback(
    async (partId: string) => {
      try {
        await removePart.mutateAsync({ carId, partId });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("toast.deleteError"),
        );
      }
    },
    [removePart, carId, t],
  );

  const totalCost = car?.purchase_cost ?? 0;
  const totalValue = parts.reduce(
    (sum, p) => sum + (p.estimated_price ?? 0) * (p.quantity ?? 1),
    0,
  );
  const profit = totalValue - totalCost;
  const partsCount = parts.length;

  const grouped = parts.reduce<Record<string, typeof parts>>((acc, p) => {
    const group = p.location_group ?? "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  if (carLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Package className="size-10 text-muted-foreground/40" />
        <Typography.Muted className="text-muted-foreground">
          {t("notFound")}
        </Typography.Muted>
        <Button
          variant="outline"
          render={<Link href="/dashboard/inventory/parts-cars" />}
        >
          {t("back")}
        </Button>
      </div>
    );
  }

  const canAddParts = car.status === "disassembling";
  const isCompleted = car.status === "completed";

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-xs"
            render={<Link href="/dashboard/inventory/parts-cars" />}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Typography.H1 className="text-2xl font-semibold tracking-tight">
                {car.make} {car.model}
              </Typography.H1>
              <Badge variant="outline">{t(`status.${car.status}`)}</Badge>
            </div>
            <Typography.Muted className="text-muted-foreground text-sm mt-0.5">
              {car.year && `${car.year} · `}
              {t("fields.cost")}: {formatMNT(car.purchase_cost)}
              {car.vin && ` · VIN: ${car.vin}`}
            </Typography.Muted>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {car.status === "arrived" && (
            <Button onClick={handleStart} disabled={startDisassembly.isPending}>
              {startDisassembly.isPending
                ? t("actions.starting")
                : t("actions.startDisassembly")}
            </Button>
          )}
          {car.status === "disassembling" && (
            <Button
              onClick={handleComplete}
              disabled={completeDisassembly.isPending || partsCount === 0}
            >
              {completeDisassembly.isPending
                ? t("actions.completing")
                : t("actions.completeDisassembly")}
            </Button>
          )}
        </div>
      </div>

      {/* Profitability */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Typography.Muted className="text-xs text-muted-foreground mb-1">
              {t("fields.partCount")}
            </Typography.Muted>
            <Typography.Text className="text-2xl font-semibold">
              {partsCount}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Typography.Muted className="text-xs text-muted-foreground mb-1">
              {t("fields.totalValue")}
            </Typography.Muted>
            <Typography.Text className="text-2xl font-semibold text-blue-600">
              {formatMNT(totalValue)}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Typography.Muted className="text-xs text-muted-foreground mb-1">
              {t("fields.profit")}
            </Typography.Muted>
            <Typography.Text
              className={`text-2xl font-semibold ${
                profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {profit >= 0 ? "+" : ""}
              {formatMNT(profit)}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>

      {/* Rapid Part Entry */}
      {canAddParts && (
        <Card className="border-2 border-amber-200 bg-amber-50/40">
          <CardContent className="p-4">
            <form onSubmit={handleAddPart} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-amber-600" />
                <span className="font-medium text-sm">
                  {t("actions.quickAddPart")}
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Field>
                  <FieldLabel htmlFor="partName" className="text-xs">
                    {t("partForm.name")}
                  </FieldLabel>
                  <Input
                    ref={nameInputRef}
                    id="partName"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder={t("partForm.namePlaceholder")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="partLocation" className="text-xs">
                    {t("partForm.group")}
                  </FieldLabel>
                  <Select
                    value={partLocation}
                    onValueChange={(v) =>
                      setPartLocation(v as PartsCarLocationGroup)
                    }
                  >
                    {_LOCATION_GROUPS.map((lg) => (
                      <SelectItem key={lg} value={lg}>
                        {t(`locations.${lg}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="partQty" className="text-xs">
                    {t("partForm.quantity")}
                  </FieldLabel>
                  <div className="flex items-center gap-0.5">$$$</div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="partPrice" className="text-xs">
                    {t("partForm.price")}
                  </FieldLabel>
                  <Input
                    id="partPrice"
                    type="number"
                    min={0}
                    step={1000}
                    value={partPrice}
                    onChange={(e) => setPartPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={!partName.trim() || adding}
                  className="shrink-0"
                >
                  {adding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {t("actions.addPart")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Parts List Grouped by Location */}
      <div className="flex flex-col gap-4">
        <Typography.H2 className="text-lg font-semibold">
          {t("partsSection.title")}
          {partsCount > 0 && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              {t("partsSection.count", { count: partsCount })}
            </span>
          )}
        </Typography.H2>

        {partsLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : partsCount === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Package className="size-10 text-muted-foreground/40" />
              <Typography.Muted className="text-muted-foreground text-sm">
                {canAddParts
                  ? t("partsSection.emptyCanAdd")
                  : t("partsSection.emptyNoParts")}
              </Typography.Muted>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([group, groupParts]) => {
            const groupLabel = t(`locations.${group}`);
            const GroupIcon = LOCATION_GROUP_ICONS[group] ?? Package;
            const groupTotal = groupParts.reduce(
              (s, p) => s + (p.estimated_price ?? 0) * (p.quantity ?? 1),
              0,
            );
            return (
              <Card key={group}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-2.5">
                    <span className="font-medium text-sm flex items-center gap-1.5">
                      <GroupIcon className="size-4 text-muted-foreground" />
                      {groupLabel}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {t("partsSection.itemCount", {
                        count: groupParts.length,
                      })}{" "}
                      ·{" "}
                      <span className="font-medium text-foreground">
                        {formatMNT(groupTotal)}
                      </span>
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {groupParts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <Typography.Text className="font-medium text-sm truncate">
                            {p.name}
                          </Typography.Text>
                          <Typography.Muted className="text-xs text-muted-foreground">
                            {p.condition === "good"
                              ? t("conditions.good")
                              : p.condition === "fair"
                                ? t("conditions.fair")
                                : t("conditions.damaged")}
                          </Typography.Muted>
                        </div>
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                          ×{p.quantity}
                        </span>
                        <span className="text-sm font-semibold tabular-nums shrink-0 w-24 text-right">
                          {formatMNT(
                            (p.estimated_price ?? 0) * (p.quantity ?? 1),
                          )}
                        </span>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(t("deleteConfirm", { name: p.name }))
                              ) {
                                handleRemovePart(p.id);
                              }
                            }}
                            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                            aria-label={t("deleteAria", { name: p.name })}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Completed footer */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-600" />
              <div>
                <Typography.Text className="font-medium text-sm text-green-800">
                  {t("completed.title")}
                </Typography.Text>
                <Typography.Text className="text-xs text-green-600">
                  {t("completed.description", {
                    count: car.total_parts_actual,
                    value: formatMNT(car.total_estimated_value),
                  })}
                </Typography.Text>
              </div>
            </div>
            <Button
              onClick={async () => {
                try {
                  const result = await publishToCatalog.mutateAsync(carId);
                  toast.success(
                    t("toast.published", { count: result.publishedCount }),
                  );
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : t("toast.publishError"),
                  );
                }
              }}
              disabled={publishToCatalog.isPending}
            >
              {publishToCatalog.isPending
                ? t("actions.publishing")
                : t("actions.publishToCatalog")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
