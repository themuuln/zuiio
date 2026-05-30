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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  usePublishPartsCarToCatalog,
  usePartsCatalog,
} from "@/lib/queries/use-inventory";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PartsCarLocationGroup } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { DetailSheetHeader } from "@/components/ui/detail-sheet-header";

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

  const { data: car, isLoading: carLoading } = usePartsCar(orgId, carId ?? "");
  const { data: parts = [], isLoading: partsLoading } = usePartsCarParts(
    orgId,
    carId ?? "",
  );

  const startDisassembly = useStartDisassembly(orgId);
  const completeDisassembly = useCompleteDisassembly(orgId);
  const addPart = useAddPartsCarPart(orgId);
  const removePart = useRemovePartsCarPart(orgId);
  const publishToCatalog = usePublishPartsCarToCatalog(orgId);

  const { data: catalogItems = [] } = usePartsCatalog(orgId);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const [partName, setPartName] = useState("");
  const [partLocation, setPartLocation] =
    useState<PartsCarLocationGroup>("other");
  const [partQty, setPartQty] = useState(1);
  const [partCondition, setPartCondition] = useState<
    "good" | "fair" | "damaged"
  >("good");
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
          part_id: selectedPartId ?? undefined,
          location_group: partLocation,
          quantity: partQty,
          condition: partCondition,
          estimated_price: partPrice,
        });
        setPartName("");
        setPartQty(1);
        setPartPrice(0);
        setPartCondition("good");
        setSelectedPartId(null);
        nameInputRef.current?.focus();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("toast.addError"));
      } finally {
        setAdding(false);
      }
    },
    [
      addPart,
      carId,
      partName,
      partLocation,
      partQty,
      partPrice,
      partCondition,
      selectedPartId,
      t,
    ],
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

  const handlePublish = useCallback(async () => {
    if (!carId) return;
    try {
      const result = await publishToCatalog.mutateAsync(carId);
      toast.success(t("toast.published", { count: result.publishedCount }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.publishError"));
    }
  }, [publishToCatalog, carId, t]);

  const totalCost = car?.purchase_cost ?? 0;
  const totalValue = parts.reduce(
    (sum, p) => sum + (p.estimated_price ?? 0) * (p.quantity ?? 1),
    0,
  );
  const profit = totalValue - totalCost;
  const partsCount = parts.length;
  const unpublishedPartsCount = parts.filter((p) => !p.part_id).length;

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
          <DetailSheetHeader
            icon={Car}
            iconLoading={isLoadingData}
            title={
              <SheetTitle className="text-base truncate">
                {isLoadingData
                  ? "Loading…"
                  : car
                    ? `${car.make} ${car.model}`
                    : t("notFound")}
              </SheetTitle>
            }
            subtitle={
              car ? (
                <>
                  <Badge variant="outline" className="text-xs">
                    {t(`status.${car.status}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {car.year && `${car.year} · `}
                    {formatMNT(car.purchase_cost)}
                  </span>
                </>
              ) : undefined
            }
            actions={
              car ? (
                <>
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
                  {car.status === "completed" && unpublishedPartsCount > 0 && (
                    <Button
                      size="sm"
                      onClick={handlePublish}
                      disabled={publishToCatalog.isPending}
                    >
                      {publishToCatalog.isPending
                        ? t("actions.publishing")
                        : t("actions.publishToCatalog")}
                    </Button>
                  )}
                </>
              ) : undefined
            }
          />
        </SheetHeader>

        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm">
              {t("notFound")}
            </Typography.Muted>
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
                <form
                  onSubmit={handleAddPart}
                  className="mt-2 flex flex-col gap-2.5"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("partForm.searchCatalog")}
                    </span>
                    <Combobox
                      items={catalogItems}
                      value={
                        catalogItems.find(
                          (item) => item.id === selectedPartId,
                        ) ?? null
                      }
                      onValueChange={(item) => {
                        if (item) {
                          setSelectedPartId(item.id);
                          setPartName(item.name);
                          if (
                            item.category &&
                            LOCATION_GROUPS.includes(
                              item.category as PartsCarLocationGroup,
                            )
                          ) {
                            setPartLocation(
                              item.category as PartsCarLocationGroup,
                            );
                          }
                          if (item.default_price) {
                            setPartPrice(item.default_price);
                          }
                        } else {
                          setSelectedPartId(null);
                        }
                      }}
                      isItemEqualToValue={(a, b) => a?.id === b?.id}
                      itemToStringLabel={(item) => item?.name ?? ""}
                    >
                      <ComboboxInput
                        placeholder={t("partForm.namePlaceholder")}
                        showTrigger
                        showClear={!!selectedPartId}
                        className="h-9 text-xs"
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.id}
                              value={item}
                              className="text-xs"
                            >
                              <span>{item.name}</span>
                              {item.part_number && (
                                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                  ({item.part_number})
                                </span>
                              )}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                        <ComboboxEmpty className="text-xs">
                          {t("partForm.catalogEmpty")}
                        </ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      ref={nameInputRef}
                      value={partName}
                      onChange={(e) => {
                        setPartName(e.target.value);
                        setSelectedPartId(null);
                      }}
                      placeholder={t("partForm.namePlaceholder")}
                      className="h-9 text-sm"
                    />
                    <select
                      value={partLocation}
                      onChange={(e) =>
                        setPartLocation(e.target.value as PartsCarLocationGroup)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {LOCATION_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {t(`locations.${g}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("partForm.condition")}
                    </span>
                    <ToggleGroup
                      value={[partCondition]}
                      onValueChange={(vals) => {
                        const val = vals[0] as
                          | "good"
                          | "fair"
                          | "damaged"
                          | undefined;
                        if (val) setPartCondition(val);
                      }}
                      className="w-full grid grid-cols-3 border border-input rounded-md overflow-hidden p-0.5 bg-muted/20"
                    >
                      <ToggleGroupItem
                        value="good"
                        className="text-xs py-1 hover:bg-muted data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm transition-all cursor-pointer"
                      >
                        {t("conditions.good")}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="fair"
                        className="text-xs py-1 hover:bg-muted data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm transition-all cursor-pointer"
                      >
                        {t("conditions.fair")}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="damaged"
                        className="text-xs py-1 hover:bg-muted data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm transition-all cursor-pointer"
                      >
                        {t("conditions.damaged")}
                      </ToggleGroupItem>
                    </ToggleGroup>
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

                  {/* Quick Templates */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("templates.title")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries({
                        engine: "engine",
                        transmission: "transmission",
                        starter: "engine",
                        alternator: "engine",
                        radiator: "cooling",
                        shock: "suspension",
                        caliper: "brake",
                        frontBumper: "body",
                        rearBumper: "body",
                        headlight: "body",
                        door: "body",
                      }).map(([key, group]) => {
                        const name = t(`templates.${key}`);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setPartName(name);
                              setPartLocation(group as PartsCarLocationGroup);
                              setSelectedPartId(null);
                            }}
                            className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs font-medium bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
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
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {t(`locations.${group}`)} ({groupParts.length})
                      </div>
                      <div className="flex flex-col gap-1">
                        {groupParts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate flex items-center gap-1.5 flex-wrap">
                                <span>{part.name}</span>
                                {part.part_id && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1 border-primary/20 text-primary bg-primary/5 font-normal shrink-0"
                                  >
                                    {t("inCatalog")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span>
                                  {part.quantity}× ·{" "}
                                  {formatMNT(part.estimated_price ?? 0)}
                                </span>
                                <span>·</span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1 font-normal border-border"
                                >
                                  {t(`conditions.${part.condition}`)}
                                </Badge>
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
