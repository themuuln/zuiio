"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { cn, formatMNT } from "@/lib/utils";
import { InvoiceQrPopover } from "./_invoice-qr-popover";

// ─── Props ───────────────────────────────────────────────────────

interface DrawerFooterProps {
  wo: WorkOrderDetail;
  taxRate: number;
  nuatEnabled: boolean;
  onNuatToggle: (checked: boolean) => Promise<void>;
  invoicePublicToken: string | null;
  saving: boolean;
  confirmStatus: string | null;
  statusNotes: string;
  creatingInvoice: boolean;
  canCancel: boolean;
  canInvoice: boolean;
  onChangeStatus: (status: string) => Promise<void>;
  onConfirmCancel: () => void;
  onStatusNotesChange: (val: string) => void;
  onMarkReady: () => Promise<void>;
  onComplete: () => void;
  onCreateInvoice: () => Promise<void>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

// ─── Status-specific action config ───────────────────────────────

interface StatusAction {
  key: string;
  icon: typeof ArrowRight;
  labelKey: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "outline";
}

function getStatusActions(
  wo: WorkOrderDetail,
  onStartDiagnose: () => void,
  onStartWork: () => void,
  onMarkReady: () => void,
  onComplete: () => void,
): StatusAction[] {
  switch (wo.status) {
    case "New":
      return [
        {
          key: "diagnose",
          icon: ArrowRight,
          labelKey: "startDiagnosing",
          onClick: onStartDiagnose,
        },
      ];
    case "Diagnosing":
      return [
        {
          key: "work",
          icon: ArrowRight,
          labelKey: "startWork",
          onClick: onStartWork,
        },
      ];
    case "In Progress":
      return [
        {
          key: "ready",
          icon: CheckCircle2,
          labelKey: "markReady",
          onClick: onMarkReady,
          variant: "default",
        },
        {
          key: "complete",
          icon: CheckCircle2,
          labelKey: "complete",
          onClick: onComplete,
          variant: "outline",
        },
      ];
    case "Ready for Pickup":
      return [
        {
          key: "complete",
          icon: CheckCircle2,
          labelKey: "complete",
          onClick: onComplete,
        },
      ];
    default:
      return [];
  }
}

// ─── Footer component ────────────────────────────────────────────

export function DrawerFooter({
  wo,
  taxRate,
  nuatEnabled,
  onNuatToggle,
  invoicePublicToken,
  saving,
  confirmStatus,
  statusNotes,
  creatingInvoice,
  canCancel,
  canInvoice,
  onChangeStatus,
  onConfirmCancel,
  onStatusNotesChange,
  onMarkReady,
  onComplete,
  onCreateInvoice,
  t,
}: DrawerFooterProps) {
  // ── Totals computation ────────────────────────────────────────
  const servicesTotal = useMemo(
    () =>
      (wo.services ?? []).reduce((s, svc) => s + Number(svc.final_price), 0),
    [wo.services],
  );
  const partsTotal = useMemo(
    () => (wo.parts ?? []).reduce((s, p) => s + Number(p.final_price), 0),
    [wo.parts],
  );
  const grandTotal = servicesTotal + partsTotal;
  const discountTotal = wo.discount_total ?? 0;
  const hasDiscount = discountTotal > 0;
  const hasTax = nuatEnabled && taxRate > 0;
  const hasAdjustments = hasDiscount || hasTax;
  const taxAmount = hasTax ? Math.round(grandTotal * taxRate) / 100 : 0;
  const totalToPay = grandTotal - discountTotal + taxAmount;

  const [totalsExpanded, setTotalsExpanded] = useState(false);

  // ── Status actions ────────────────────────────────────────────

  const actions = useMemo(
    () =>
      getStatusActions(
        wo,
        () => onChangeStatus("Diagnosing"),
        () => onChangeStatus("In Progress"),
        onMarkReady,
        onComplete,
      ),
    [wo, onChangeStatus, onMarkReady, onComplete],
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex shrink-0 flex-col border-t border-border/70 bg-card">
      {/* ── Status change confirmation ──────────────────────── */}
      {confirmStatus && (
        <div className="bg-destructive/5 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-destructive">
                {t("statusNotesGenericTitle", { status: confirmStatus })}?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {confirmStatus === "Completed"
                  ? t("confirmComplete")
                  : t("confirmCancel")}
              </p>
              <Input
                placeholder={t("addNotesOptional")}
                value={statusNotes}
                onChange={(e) => onStatusNotesChange(e.target.value)}
                className="mt-2 h-8 text-xs"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onConfirmCancel}
                  className="h-7 text-xs"
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  variant={
                    confirmStatus === "Cancelled" ? "destructive" : "default"
                  }
                  disabled={saving}
                  onClick={() => onChangeStatus(confirmStatus)}
                  className="h-7 text-xs min-w-[90px]"
                >
                  {saving ? t("updating") : t("confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Totals row ─────────────────────────────────────────── */}
      <div className="flex items-stretch border-b border-border/40">
        {/* Totals breakdown — left */}
        <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 min-w-0">
          {/* VAT toggle */}
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1">
            <Switch
              checked={nuatEnabled}
              onCheckedChange={onNuatToggle}
              className="scale-75"
            />
            <Label className="text-[10px] font-medium text-muted-foreground cursor-pointer">
              {t("vatAbbr") ?? "VAT"}
            </Label>
          </div>

          {/* Services total */}
          <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
            {t("services")}:{" "}
            <span className="font-medium tabular-nums text-foreground/80">
              {formatMNT(servicesTotal)}
            </span>
          </span>

          {/* Separator */}
          <span className="hidden text-muted-foreground/30 sm:inline">·</span>

          {/* Parts total */}
          <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
            {t("parts")}:{" "}
            <span className="font-medium tabular-nums text-foreground/80">
              {formatMNT(partsTotal)}
            </span>
          </span>

          {/* Discount */}
          {hasDiscount && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-xs text-destructive/70 whitespace-nowrap">
                {t("discount")}: -{formatMNT(discountTotal)}
              </span>
            </>
          )}
        </div>

        {/* Grand total — right */}
        <button
          type="button"
          onClick={() => setTotalsExpanded((e) => !e)}
          className="flex shrink-0 items-center gap-1.5 border-l border-border/40 px-4 py-2 transition-colors hover:bg-muted/30"
        >
          <span className="text-xs font-semibold tabular-nums text-primary">
            {formatMNT(hasAdjustments ? totalToPay : grandTotal)}
          </span>
          <ChevronDown
            className={cn(
              "size-3 text-muted-foreground/50 transition-transform",
              totalsExpanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* ── Totals expanded breakdown ─────────────────────────── */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          totalsExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden border-b border-border/40">
          <div className="flex flex-col gap-1 px-4 py-2">
            <div className="flex justify-between text-xs leading-tight">
              <span className="text-muted-foreground/70">{t("services")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs leading-tight">
              <span className="text-muted-foreground/70">{t("parts")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsTotal)}
              </span>
            </div>
            <Separator className="bg-primary/10 my-0.5" />
            <div className="flex justify-between text-xs font-medium leading-tight">
              <span className="text-muted-foreground/70">
                {t("grandTotal")}
              </span>
              <span className="tabular-nums">{formatMNT(grandTotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-xs leading-tight text-destructive/70">
                <span>{t("discount")}</span>
                <span className="tabular-nums">
                  -{formatMNT(discountTotal)}
                </span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between text-xs leading-tight text-muted-foreground/70">
                <span>
                  {t("vatLabel") ?? "VAT"} ({taxRate}%)
                </span>
                <span className="tabular-nums">{formatMNT(taxAmount)}</span>
              </div>
            )}
            {hasAdjustments && (
              <>
                <Separator className="bg-primary/10 my-0.5" />
                <div className="flex justify-between text-xs font-semibold leading-tight">
                  <span className="text-muted-foreground/70">
                    {t("totalToPay")}
                  </span>
                  <span className="tabular-nums text-primary">
                    {formatMNT(totalToPay)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        {/* Secondary actions — left */}
        <div className="flex items-center gap-2">
          {canInvoice &&
            (invoicePublicToken ? (
              <InvoiceQrPopover
                url={`${window.location.origin}/invoice/${invoicePublicToken}`}
              >
                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs"
                  onClick={() =>
                    window.open(
                      `${window.location.origin}/invoice/${invoicePublicToken}`,
                      "_blank",
                    )
                  }
                >
                  <FileText className="size-3.5" />
                  {t("invoice")}
                </Button>
              </InvoiceQrPopover>
            ) : (
              <Button
                variant="outline"
                className="h-9 px-3 text-xs"
                onClick={onCreateInvoice}
                disabled={saving || creatingInvoice}
              >
                <FileText className="size-3.5" />
                {creatingInvoice ? t("creating") : t("createInvoice")}
              </Button>
            ))}

          {canInvoice && canCancel && <div className="h-5 w-px bg-border" />}

          {canCancel && (
            <Button
              variant="ghost"
              onClick={() => onChangeStatus("Cancelled")}
              disabled={saving}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
              {t("cancel")}
            </Button>
          )}
        </div>

        {/* Primary status actions — right */}
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isDefault = (action.variant ?? "default") === "default";
            const isPending = false;
            return (
              <Button
                key={action.key}
                variant={isDefault ? "default" : "outline"}
                className="h-9 flex-1 px-4 text-xs font-semibold sm:flex-none"
                onClick={action.onClick}
                disabled={saving || isPending}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                {t(action.labelKey)}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
