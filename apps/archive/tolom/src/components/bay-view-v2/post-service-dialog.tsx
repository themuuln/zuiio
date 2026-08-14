"use client";

import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Gauge,
  Loader2,
  MessageSquare,
  Package,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { getDefaultTransferBank } from "@/lib/payments/org-bank-accounts";
import { reportServerError } from "@/lib/sentry-report-server";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import type {
  EnrichedServiceItem,
  WorkOrderPartItem,
} from "@/lib/services/post-service-service";
import { getWorkOrderParts } from "@/lib/services/post-service-service";
import { formatMNT } from "@/lib/utils";
import {
  computeNextDueDate,
  computeNextDueKm,
  formatDate,
  formatKm,
} from "./_helpers";
import type { PaymentMethodFees } from "./_payment-fees";
import { PaymentMethodField } from "./_payment-method-field";
import type { BayPaymentMethod, PostServiceFormData } from "./_schema";

export type { PostServiceFormData };

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
  grandTotal: number;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  onConfirm: (data: PostServiceFormData) => Promise<void>;
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
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onConfirm,
}: Props) {
  const t = useTranslations("bayView");
  const [odometer, setOdometer] = useState<string>(
    currentOdometer?.toString() ?? "",
  );
  const [mechanicNotes, setMechanicNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<BayPaymentMethod>("bank_transfer");
  const [transferBankId, setTransferBankId] = useState<string | null>(
    () => getDefaultTransferBank(transferBanks)?.id ?? null,
  );
  useEffect(() => {
    if (!transferBankId && transferBanks.length > 0) {
      setTransferBankId(getDefaultTransferBank(transferBanks)?.id ?? null);
    }
  }, [transferBanks, transferBankId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [services, setServices] = useState<EnrichedServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [parts, setParts] = useState<WorkOrderPartItem[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);

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
        setError(t("failedToLoadServices"));
      } finally {
        setServicesLoading(false);
      }
    }
    load();
  }, [open, woId, t]);

  // Fetch parts on open
  useEffect(() => {
    if (!open) return;
    async function load() {
      setPartsLoading(true);
      try {
        const data = await getWorkOrderParts(woId);
        setParts(data);
      } catch {
        // Parts are informational only — silently fail
      } finally {
        setPartsLoading(false);
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
    if (
      odometer.trim() !== "" &&
      (odometerNum === null || Number.isNaN(odometerNum))
    ) {
      setError("Please enter a valid odometer reading");
      return;
    }

    if (
      paymentMethod === "bank_transfer" &&
      transferBanks.length > 0 &&
      !transferBankId
    ) {
      setError(t("transferBankRequired"));
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
        paymentMethod,
        transferBankId,
      });
    } catch (err) {
      reportServerError("Unexpected error", err);
      setError(
        err instanceof Error ? err.message : t("failedToSavePostServiceData"),
      );
    } finally {
      setSaving(false);
    }
  }

  const isComplete = newStatus === "Completed";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DetailDrawer.Title className="flex items-center gap-2 text-base">
              <Car className="size-4 text-muted-foreground" />
              {isComplete
                ? t("postServiceCompleteTitle")
                : t("postServiceTitle")}
            </DetailDrawer.Title>
            <DetailDrawer.Description className="text-xs">
              {t("readyForPickupSubtitle")}
            </DetailDrawer.Description>
          </div>
          <span className="shrink-0 rounded-md bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground/70">
            {vehiclePlate}
          </span>
        </div>
      </DetailDrawer.Header>

      <DetailDrawer.Body className="px-4 py-4 sm:px-5">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {/* Odometer */}
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Gauge className="size-4 text-muted-foreground/60" />
                {t("postServiceOdometer")}
              </Label>
              <div className="flex items-center gap-1.5">
                <NumericInput
                  value={odometer ? parseInt(odometer, 10) : 0}
                  onChange={(val) => setOdometer(val ? val.toString() : "")}
                  placeholder={t("postServiceOdometerPlaceholder")}
                  min={0}
                  className="h-9 w-32 rounded-lg border-border bg-background px-2.5 text-right text-sm font-semibold tabular-nums text-foreground"
                />
                <span className="text-xs text-muted-foreground/70">км</span>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="size-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("postServiceServicesTitle")}
                </h3>
                {hasEntries && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] tabular-nums"
                  >
                    {entries.length}
                  </Badge>
                )}
              </div>
              {hasEntries && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAllExpanded(!allExpanded)}
                  className="h-auto gap-1 text-xs"
                >
                  {allExpanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                  {allExpanded ? t("collapseToggle") : t("expandToggle")}
                </Button>
              )}
            </header>

            <div className="flex flex-col gap-2 p-3">
              {servicesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : hasEntries ? (
                entries.map((entry, idx) => (
                  <ServiceCard
                    key={entry.workOrderServiceId}
                    entry={entry}
                    odometer={odometerNum}
                    onChange={(updates) => updateEntry(idx, updates)}
                  />
                ))
              ) : (
                <Typography.Muted className="py-2 text-center text-xs text-muted-foreground/60 italic">
                  {t("noServicesRecorded")}
                </Typography.Muted>
              )}
            </div>
          </section>

          {/* Parts */}
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <header className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                <Package className="size-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("parts")}
              </h3>
              {parts.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] tabular-nums"
                >
                  {parts.length}
                </Badge>
              )}
            </header>

            <div className="flex flex-col gap-1.5 p-3">
              {partsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : parts.length === 0 ? (
                <Typography.Muted className="py-2 text-center text-xs text-muted-foreground/60 italic">
                  {t("noPartsRecorded")}
                </Typography.Muted>
              ) : (
                parts.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">
                        {part.part_name}
                      </span>
                      {part.part_number && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          #{part.part_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {part.quantity} x {formatMNT(part.unit_price)}
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatMNT(part.final_price)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Mechanic notes */}
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <header className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                <MessageSquare className="size-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("mechanicNotesLabel")}
              </h3>
            </header>
            <div className="p-3">
              <Input
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                placeholder={t("notePlaceholder")}
                className="rounded-lg border-border bg-background"
              />
            </div>
          </section>

          {!isComplete && (
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              <div className="p-3">
                <PaymentMethodField
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  transferBankId={transferBankId}
                  onTransferBankChange={setTransferBankId}
                  subtotal={grandTotal}
                  fees={paymentMethodFees}
                  transferBanks={transferBanks}
                />
              </div>
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2  bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
              <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
              <Typography.Text className="text-xs text-red-700 dark:text-red-400">
                {error}
              </Typography.Text>
            </div>
          )}
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions justify="end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="default"
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                {t("postServiceSaving")}
              </>
            ) : isComplete ? (
              t("complete")
            ) : (
              t("markReady")
            )}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
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
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm transition-[color,background-color,border-color] duration-200">
      <Button
        variant="ghost"
        onClick={() => onChange({ expanded: !entry.expanded })}
        className="w-full justify-between px-3 py-3 h-auto"
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
          <ChevronUp className="size-4 shrink-0 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground/50" />
        )}
      </Button>

      {entry.expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border/40 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("postServiceIntervalMonths")}
              </Label>
              <NumericInput
                value={entry.intervalMonths ?? 0}
                onChange={(val) =>
                  onChange({
                    intervalMonths: val || null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("postServiceIntervalKm")}
              </Label>
              <NumericInput
                value={entry.intervalKm ?? 0}
                onChange={(val) =>
                  onChange({
                    intervalKm: val || null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
          </div>

          {(nextDate || nextKm) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-2">
              <span className="font-medium">{t("postServiceNextDue")}:</span>
              {nextDate && <span>{formatDate(nextDate)}</span>}
              {nextDate && nextKm && <span>·</span>}
              {nextKm && <span>{formatKm(nextKm)} km</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
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
              <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("notesLabel")}
              </Label>
              <Input
                value={entry.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                className="h-8 text-xs"
                placeholder={t("optional")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
