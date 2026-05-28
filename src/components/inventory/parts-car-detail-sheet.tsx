"use client";

import {
  Car,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useAddPartsCarPart,
  useCompleteDisassembly,
  usePartsCar,
  usePartsCarParts,
  useRemovePartsCarPart,
  useStartDisassembly,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PartsCarLocationGroup } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface PartsCarDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string | null;
}

const LOCATION_GROUPS: PartsCarLocationGroup[] = [
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

export function PartsCarDetailSheet({
  open,
  onOpenChange,
  carId,
}: PartsCarDetailSheetProps) {
  const t = useTranslations("partsCars");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: car, isLoading: carLoading } = usePartsCar(
    orgId,
    carId ?? "",
  );
  const { data: parts = [], isLoading: partsLoading } = usePartsCarParts(
    orgId,
    carId ?? "",
  );

  const startDisassembly = useStartDisassembly(orgId);
  const completeDisassembly = useCompleteDisassembly(orgId);
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
    if (!carId) return;
    try {
      await startDisassembly.mutateAsync(carId);
      toast.success(t("toast.started"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.startError"));
    }
  }, [startDisassembly, carId, t]);

  const handleComplete = useCallback(async () => {
    if (!carId) return;
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
      if (!partName.trim() || !carId) {
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
      if (!carId) return;
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

  const isLoadingData = (carLoading || partsLoading) && open;
  const notFound = open && !carLoading && !car;

  const canAddParts = car?.status === "disassembling";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              {isLoadingData ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Car className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">
                {isLoadingData
                  ? "Loading…"
                  : car
                    ? `${car.make} ${car.model}`
                    : t("notFound")}
              </SheetTitle>
              {car && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {t(`status.${car.status}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {car.year && `${car.year} · `}
                    {formatMNT(car.purchase_cost)}
                  </span>
                </div>
              )}
            </div>
            {/* Action buttons in header */}
            {car && (
              <div className="flex items-center gap-1 shrink-0">
                {car.status === "arrived" && (
                  <Button
                    size="sm"
                    onClick={handleStart}
                    disabled={startDisassembly.isPending}
                  >
                    {startDisassembly.isPending
                      ? t("actions.starting")
                      : t("actions.startDisassembly")}
                  </Button>
                )}
                {car.status === "disassembling" && (
                  <Button
                    size="sm"
                    onClick={handleComplete}
                    disabled={
                      completeDisassembly.isPending || partsCount === 0
                    }
                  >
                    {completeDisassembly.isPending
                      ? t("actions.completing")
                      : t("actions.completeDisassembly")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm">{t("notFound")}</Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}

        {!isLoadingData && !notFound && car && (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Profitability summary */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/50">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {t("fields.partCount")}
                </div>
                <div className="text-lg font-semibold">{partsCount}</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {t("fields.totalValue")}
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatMNT(totalValue)}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {t("fields.profit")}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {profit >= 0 ? "+" : ""}
                  {formatMNT(profit)}
                </div>
              </div>
            </div>

            {/* Rapid Part Entry */}
            {canAddParts && (
              <div className="px-4 py-3 border-b border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Add Part
                </span>
                <form onSubmit={handleAddPart} className="mt-2 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      ref={nameInputRef}
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      placeholder="Part name"
                      className="h-9 text-sm"
                    />
                    <select
                      value={partLocation}
                      onChange={(e) =>
                        setPartLocation(
                          e.target.value as PartsCarLocationGroup,
                        )
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {LOCATION_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={partQty}
                      onChange={(e) => setPartQty(Number(e.target.value))}
                      className="h-9 text-sm w-20"
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={partPrice}
                      onChange={(e) => setPartPrice(Number(e.target.value))}
                      className="h-9 text-sm flex-1"
                      placeholder="Price ₮"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={adding || !partName.trim()}
                    >
                      {adding ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Parts list */}
            <div className="px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Parts ({partsCount})
              </span>
              {partsCount === 0 ? (
                <Typography.Muted className="mt-2 text-sm text-muted-foreground">
                  No parts added yet
                </Typography.Muted>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  {Object.entries(grouped).map(([group, groupParts]) => (
                    <div key={group}>
                      <div className="text-xs font-medium text-muted-foreground capitalize mb-1">
                        {group} ({groupParts.length})
                      </div>
                      <div className="flex flex-col gap-1">
                        {groupParts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {part.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {part.quantity}× ·{" "}
                                {formatMNT(part.estimated_price ?? 0)}
                              </div>
                            </div>
                            {canAddParts && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-destructive shrink-0"
                                onClick={() => handleRemovePart(part.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
