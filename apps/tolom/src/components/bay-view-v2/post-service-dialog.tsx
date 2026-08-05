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
    if (!odometerNum && odometer.trim()) {
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
      setSaving(false);
    }
  }

  const isComplete = newStatus === "Completed";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2 text-base">
          <Car className="size-4 text-muted-foreground" />
          {isComplete ? t("postServiceCompleteTitle") : t("postServiceTitle")}
          <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 px-2 py-1 ml-1">
            {vehiclePlate}
          </span>
        </DetailDrawer.Title>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {/* Odometer */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <Gauge className="size-4" />
            {t("postServiceOdometer")}
          </Label>
          <NumericInput
            value={odometer ? parseInt(odometer, 10) : 0}
            onChange={(val) => setOdometer(val ? val.toString() : "")}
            placeholder={t("postServiceOdometerPlaceholder")}
            min={0}
          />
        </div>

        {/* Services */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("postServiceServicesTitle")}
              <Badge variant="secondary">{entries.length}</Badge>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAllExpanded(!allExpanded)}
              className="gap-1 text-xs h-auto"
            >
              {allExpanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
              {allExpanded ? t("collapseToggle") : t("expandToggle")}
            </Button>
          </div>

          {servicesLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!servicesLoading && !hasEntries && (
            <Typography.Muted className="text-xs text-muted-foreground/60 italic py-2">
              {t("noServicesRecorded")}
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

        {/* Parts */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Package className="size-4" />
              {t("parts")}
              <Badge variant="secondary">{parts.length}</Badge>
            </span>
          </div>

          {partsLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!partsLoading && parts.length === 0 && (
            <Typography.Muted className="text-xs text-muted-foreground/60 italic py-2">
              {t("noPartsRecorded")}
            </Typography.Muted>
          )}

          {!partsLoading && parts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2"
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
              ))}
            </div>
          )}
        </div>

        {/* Mechanic notes */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("mechanicNotesLabel")}
          </Label>
          <Input
            value={mechanicNotes}
            onChange={(e) => setMechanicNotes(e.target.value)}
            placeholder={t("notePlaceholder")}
          />
        </div>

        {!isComplete && (
          <PaymentMethodField
            value={paymentMethod}
            onChange={setPaymentMethod}
            transferBankId={transferBankId}
            onTransferBankChange={setTransferBankId}
            subtotal={grandTotal}
            fees={paymentMethodFees}
            transferBanks={transferBanks}
          />
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
    <div className=" border border-border/60 bg-card/50 overflow-hidden transition-[color,background-color,border-color] duration-200">
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
