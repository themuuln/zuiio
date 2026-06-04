"use client";

import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Gauge,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import type { EnrichedServiceItem } from "@/lib/services/post-service-service";

export interface PostServiceFormData {
  odometerReading: number | null;
  recommendations: Array<{
    workOrderServiceId: string;
    serviceName: string;
    serviceCatalogId: string | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    priority: "standard" | "important" | "urgent";
    notes?: string;
  }>;
  mechanicNotes: string;
}

interface ServiceFormEntry {
  workOrderServiceId: string;
  serviceName: string;
  serviceCatalogId: string | null;
  intervalMonths: number | null;
  intervalKm: number | null;
  priority: "standard" | "important" | "urgent";
  notes: string;
  expanded: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  bayData: BaySlotData;
  newStatus: string;
  onConfirm: (data: PostServiceFormData) => Promise<void>;
}

function computeNextDueDate(months: number | null): string | null {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function computeNextDueKm(
  km: number | null,
  odometer: number | null,
): number | null {
  if (!km || !odometer) return null;
  return odometer + km;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatKm(km: number): string {
  return km.toLocaleString("en-US");
}

export function PostServiceDialog({
  open,
  onOpenChange,
  woId,
  vehicleId: _vehicleId,
  vehiclePlate,
  currentOdometer,
  bayData: _bayData,
  newStatus,
  onConfirm,
}: Props) {
  const t = useTranslations("bayView");
  const [odometer, setOdometer] = useState<string>(
    currentOdometer?.toString() ?? "",
  );
  const [mechanicNotes, setMechanicNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [services, setServices] = useState<EnrichedServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Fetch services on open
  useEffect(() => {
    if (!open) return;
    async function load() {
      setServicesLoading(true);
      try {
        const { getWorkOrderServicesWithIntervals } = await import(
          "@/lib/services/post-service-service"
        );
        const data = await getWorkOrderServicesWithIntervals(woId);
        setServices(data);
      } catch {
        setError("Failed to load services");
      } finally {
        setServicesLoading(false);
      }
    }
    load();
  }, [open, woId]);

  // Build form entries from services
  const [entries, setEntries] = useState<ServiceFormEntry[]>([]);
  useEffect(() => {
    setEntries(
      services.map((svc) => ({
        workOrderServiceId: svc.id,
        serviceName: svc.service_name,
        serviceCatalogId: svc.service_catalog_id,
        intervalMonths: svc.catalog_interval_months,
        intervalKm: svc.catalog_interval_km,
        priority: "standard" as const,
        notes: "",
        expanded: true,
      })),
    );
  }, [services]);

  const odometerNum = useMemo(
    () => (odometer ? parseInt(odometer, 10) : null),
    [odometer],
  );
  const hasEntries = entries.length > 0;

  function updateEntry(index: number, updates: Partial<ServiceFormEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...updates } : e)),
    );
  }

  async function handleSubmit() {
    if (!odometerNum && odometer.trim()) {
      setError("Please enter a valid odometer reading");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        odometerReading: odometerNum,
        recommendations: entries.map((e) => ({
          workOrderServiceId: e.workOrderServiceId,
          serviceName: e.serviceName,
          serviceCatalogId: e.serviceCatalogId,
          intervalMonths: e.intervalMonths,
          intervalKm: e.intervalKm,
          priority: e.priority,
          notes: e.notes || undefined,
        })),
        mechanicNotes: mechanicNotes.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save post-service data",
      );
      setSaving(false);
    }
  }

  const isComplete = newStatus === "Completed";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} nested>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Car className="size-4 text-muted-foreground" />
            {isComplete ? t("postServiceCompleteTitle") : t("postServiceTitle")}
            <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50  px-2 py-0.5 ml-1">
              {vehiclePlate}
            </span>
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {/* Odometer */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Gauge className="size-3.5" />
              {t("postServiceOdometer")}
            </Label>
            <Input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder={t("postServiceOdometerPlaceholder")}
              min={0}
            />
          </div>

          {/* Services */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                {t("postServiceServicesTitle")}
                <Badge variant="secondary">{entries.length}</Badge>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAllExpanded(!allExpanded)}
                className="gap-0.5 text-[10px] h-auto"
              >
                {allExpanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                {allExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>

            {servicesLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!servicesLoading && !hasEntries && (
              <Typography.Muted className="text-xs text-muted-foreground/60 italic py-2">
                No services recorded on this work order.
              </Typography.Muted>
            )}

            <div className="flex flex-col gap-2">
              {entries.map((entry, idx) => (
                <ServiceCard
                  key={entry.workOrderServiceId}
                  entry={entry}
                  odometer={odometerNum}
                  onChange={(updates) => updateEntry(idx, updates)}
                />
              ))}
            </div>
          </div>

          {/* Mechanic notes */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Mechanic Notes
            </Label>
            <Input
              value={mechanicNotes}
              onChange={(e) => setMechanicNotes(e.target.value)}
              placeholder={t("notePlaceholder")}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2  bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <Typography.Text className="text-xs text-red-700 dark:text-red-400">
                {error}
              </Typography.Text>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="default"
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} size="default" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {saving
                ? t("postServiceSaving")
                : isComplete
                  ? t("complete")
                  : t("markReady")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── Service Card Sub-Component ────────────────────────────

function ServiceCard({
  entry,
  odometer,
  onChange,
}: {
  entry: ServiceFormEntry;
  odometer: number | null;
  onChange: (updates: Partial<ServiceFormEntry>) => void;
}) {
  const t = useTranslations("bayView");
  const nextDate = computeNextDueDate(entry.intervalMonths);
  const nextKm = computeNextDueKm(entry.intervalKm, odometer);

  return (
    <div className=" border border-border/60 bg-card/50 overflow-hidden transition-all duration-200">
      <Button
        variant="ghost"
        onClick={() => onChange({ expanded: !entry.expanded })}
        className="w-full justify-between px-3 py-2.5 h-auto"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {entry.serviceName}
          </span>
          {entry.priority !== "standard" && (
            <Badge variant="outline">{entry.priority}</Badge>
          )}
        </div>
        {entry.expanded ? (
          <ChevronUp className="size-3.5 shrink-0 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
        )}
      </Button>

      {entry.expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2.5 border-t border-border/40 pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("postServiceIntervalMonths")}
              </Label>
              <Input
                type="number"
                value={entry.intervalMonths ?? ""}
                onChange={(e) =>
                  onChange({
                    intervalMonths: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("postServiceIntervalKm")}
              </Label>
              <Input
                type="number"
                value={entry.intervalKm ?? ""}
                onChange={(e) =>
                  onChange({
                    intervalKm: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
          </div>

          {(nextDate || nextKm) && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30  px-2 py-1.5">
              <span className="font-medium">{t("postServiceNextDue")}:</span>
              {nextDate && <span>{formatDate(nextDate)}</span>}
              {nextDate && nextKm && <span>·</span>}
              {nextKm && <span>{formatKm(nextKm)} km</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("postServicePriority")}
              </Label>
              <Select
                value={entry.priority}
                onValueChange={(val) => {
                  if (val)
                    onChange({
                      priority: val as "standard" | "important" | "urgent",
                    });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-xs">
                    {t("postServicePriorityStandard")}
                  </SelectItem>
                  <SelectItem value="important" className="text-xs">
                    {t("postServicePriorityImportant")}
                  </SelectItem>
                  <SelectItem value="urgent" className="text-xs">
                    {t("postServicePriorityUrgent")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                Notes
              </Label>
              <Input
                value={entry.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                className="h-8 text-xs"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
