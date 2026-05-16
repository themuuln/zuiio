"use client";

import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Cpu,
  Fan,
  Flame,
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
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  usePartsCar,
  usePartsCarParts,
  useStartDisassembly,
  useCompleteDisassembly,
  useAddPartsCarPart,
  useRemovePartsCarPart,
} from "@/lib/queries/use-inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import { formatMNT } from "@/lib/utils";
import { toast } from "sonner";
import { useCallback, useRef, useState } from "react";
import type { PartsCarLocationGroup } from "@/lib/types";

const STATUS_BADGE: Record<
  string,
  { label: string; color: string }
> = {
  arrived: { label: "Ирсэн", color: "bg-blue-100 text-blue-700" },
  disassembling: {
    label: "Задалж байна",
    color: "bg-amber-100 text-amber-700",
  },
  completed: { label: "Дууссан", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Цуцлагдсан", color: "bg-red-100 text-red-700" },
};

const LOCATION_GROUPS: { value: PartsCarLocationGroup; label: string }[] = [
  { value: "engine", label: "Хөдөлгүүр" },
  { value: "transmission", label: "Хурдны хайрцаг" },
  { value: "suspension", label: "Түдүүр" },
  { value: "brake", label: "Тормоз" },
  { value: "body", label: "Их бие / Кузов" },
  { value: "interior", label: "Салон" },
  { value: "electrical", label: "Цахилгаан" },
  { value: "cooling", label: "Хөргөлт" },
  { value: "exhaust", label: "Яндан" },
  { value: "fuel", label: "Түлш" },
  { value: "steering", label: "Жолооны механизм" },
  { value: "ac", label: "Кондиционер" },
  { value: "other", label: "Бусад" },
];

const LOCATION_GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
  const params = useParams<{ id: string }>();
  const carId = params.id;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: car, isLoading: carLoading } = usePartsCar(orgId, carId);
  const { data: parts = [], isLoading: partsLoading } =
    usePartsCarParts(orgId, carId);

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
    try {
      await startDisassembly.mutateAsync(carId);
      toast.success("Задалж эхэллээ");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Эхлэхэд алдаа гарлаа",
      );
    }
  }, [startDisassembly, carId]);

  const handleComplete = useCallback(async () => {
    if (!confirm("Задлага дуусгах уу? Бүх сэлбэгүүд бүртгэгдсэн эсэхийг шалгаарай.")) return;
    try {
      await completeDisassembly.mutateAsync(carId);
      toast.success("Задлага дууслаа");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Дуусгахад алдаа гарлаа",
      );
    }
  }, [completeDisassembly, carId]);

  const handleAddPart = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!partName.trim()) return;
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
        toast.error(
          err instanceof Error ? err.message : "Нэмэхэд алдаа гарлаа",
        );
      } finally {
        setAdding(false);
      }
    },
    [addPart, carId, partName, partLocation, partQty, partPrice],
  );

  const handleRemovePart = useCallback(
    async (partId: string) => {
      try {
        await removePart.mutateAsync({ carId, partId });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Устгахад алдаа гарлаа",
        );
      }
    },
    [removePart, carId],
  );

  const totalCost = car?.purchase_cost ?? 0;
  const totalValue = parts.reduce(
    (sum, p) => sum + (p.estimated_price ?? 0) * (p.quantity ?? 1),
    0,
  );
  const profit = totalValue - totalCost;
  const partsCount = parts.length;

  const grouped = parts.reduce<
    Record<string, typeof parts>
  >((acc, p) => {
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
        <Package className="size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Машин олдсонгүй</p>
        <Button variant="outline" render={<Link href="/dashboard/inventory/parts-cars" />}>
          Буцах
        </Button>
      </div>
    );
  }

  const canAddParts = car.status === "disassembling";
  const isCompleted = car.status === "completed";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/dashboard/inventory/parts-cars" />}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {car.make} {car.model}
              </h1>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_BADGE[car.status]?.color ?? ""}`}
              >
                {STATUS_BADGE[car.status]?.label ?? car.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {car.year && `${car.year} · `}
              Өртөг: {formatMNT(car.purchase_cost)}
              {car.vin && ` · VIN: ${car.vin}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {car.status === "arrived" && (
            <Button onClick={handleStart} disabled={startDisassembly.isPending}>
              {startDisassembly.isPending
                ? "Эхлүүлж байна..."
                : "Задалж эхлэх"}
            </Button>
          )}
          {car.status === "disassembling" && (
            <Button
              onClick={handleComplete}
              disabled={completeDisassembly.isPending || partsCount === 0}
            >
              {completeDisassembly.isPending
                ? "Дуусгаж байна..."
                : "Задлага дуусгах"}
            </Button>
          )}
        </div>
      </div>

      {/* Profitability */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Сэлбэгийн тоо</p>
            <p className="text-2xl font-bold">{partsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Нийт үнэлгээ</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatMNT(totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ашиг</p>
            <p
              className={`text-2xl font-bold ${
                profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {profit >= 0 ? "+" : ""}
              {formatMNT(profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rapid Part Entry */}
      {canAddParts && (
        <Card className="border-2 border-amber-200 bg-amber-50/40">
          <CardContent className="p-4">
            <form onSubmit={handleAddPart} className="space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-amber-600" />
                <span className="font-medium text-sm">
                  Сэлбэг хурдан нэмэх
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label htmlFor="partName" className="text-xs">
                    Сэлбэгийн нэр
                  </Label>
                  <Input
                    ref={nameInputRef}
                    id="partName"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="Радиатор, хаалга, толгой гэрэл..."
                    autoFocus
                  />
                </div>
                <div className="w-[140px] space-y-1">
                  <Label htmlFor="partLocation" className="text-xs">
                    Бүлэг
                  </Label>
                  <Select
                    value={partLocation}
                    onValueChange={(v) =>
                      setPartLocation(v as PartsCarLocationGroup)
                    }
                  >
                    <SelectTrigger id="partLocation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_GROUPS.map((g) => {
                        const GroupIcon = LOCATION_GROUP_ICONS[g.value] ?? Package;
                        return (
                          <SelectItem key={g.value} value={g.value}>
                            <span className="flex items-center gap-2">
                              <GroupIcon className="size-3.5 text-muted-foreground" />
                              {g.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[80px] space-y-1">
                  <Label htmlFor="partQty" className="text-xs">
                    Тоо
                  </Label>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setPartQty(Math.max(1, partQty - 1))}
                      className="flex size-11 items-center justify-center rounded-md border text-lg font-semibold hover:bg-muted transition-colors cursor-pointer"
                      aria-label="Тоо хэмжээ хасах"
                    >
                      −
                    </button>
                    <span className="flex size-11 items-center justify-center font-semibold tabular-nums text-sm">
                      {partQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPartQty(partQty + 1)}
                      className="flex size-11 items-center justify-center rounded-md border text-lg font-semibold hover:bg-muted transition-colors cursor-pointer"
                      aria-label="Тоо хэмжээ нэмэх"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="w-[120px] space-y-1">
                  <Label htmlFor="partPrice" className="text-xs">
                    Үнэ (₮)
                  </Label>
                  <Input
                    id="partPrice"
                    type="number"
                    min={0}
                    step={1000}
                    value={partPrice}
                    onChange={(e) => setPartPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
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
                  Нэмэх
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Parts List Grouped by Location */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Сэлбэгүүд
          {partsCount > 0 && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({partsCount} ширхэг)
            </span>
          )}
        </h2>

        {partsLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : partsCount === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Package className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                {canAddParts
                  ? "Дээрх формаар сэлбэгүүдээ нэмж эхлээрэй"
                  : "Сэлбэг бүртгэгдээгүй байна"}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([group, groupParts]) => {
            const groupLabel =
              LOCATION_GROUPS.find((g) => g.value === group)?.label ?? group;
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
                      {groupParts.length} ширхэг ·{" "}
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
                          <p className="font-medium text-sm truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.condition === "good"
                              ? "Сайн"
                              : p.condition === "fair"
                                ? "Дунд"
                                : "Гэмтэлтэй"}
                          </p>
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
                              if (confirm(`"${p.name}"-г устгах уу?`)) {
                                handleRemovePart(p.id);
                              }
                            }}
                            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                            aria-label={`${p.name}-г устгах`}
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
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="size-5 text-green-600" />
            <div>
              <p className="font-medium text-sm text-green-800">
                Задлага дуусгасан
              </p>
              <p className="text-xs text-green-600">
                Нийт {car.total_parts_actual} сэлбэг, нийт{" "}
                {formatMNT(car.total_estimated_value)} үнэлгээтэй
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
