"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkOrderDetail } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { InvoiceQrPopover } from "./_invoice-qr-popover";

// ─── Props ───────────────────────────────────────────────────────

interface DrawerFooterProps {
  wo: WorkOrderDetail;
  grandTotal: number;
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
  t: (key: string, values?: Record<string, string>) => string;
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
  grandTotal,
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
  const actions = getStatusActions(
    wo,
    () => onChangeStatus("Diagnosing"),
    () => onChangeStatus("In Progress"),
    onMarkReady,
    onComplete,
  );

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2 flex flex-col gap-2">
      {/* Status change confirmation */}
      {confirmStatus && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle className="text-xs">
            {t("statusNotesGenericTitle", { status: confirmStatus })}?
          </AlertTitle>
          <AlertDescription className="text-xs">
            {confirmStatus === "Completed"
              ? t("confirmComplete")
              : t("confirmCancel")}
          </AlertDescription>
          <div className="col-span-full mt-1 flex flex-col gap-2">
            <Input
              placeholder={t("addNotesOptional")}
              value={statusNotes}
              onChange={(e) => onStatusNotesChange(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-2 justify-end">
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
        </Alert>
      )}

      {/* Primary status flow + secondary actions */}
      <div className="flex items-center gap-2">
        {/* Grand total — left side */}
        <span className="text-xs text-muted-foreground mr-auto">
          {t("grandTotal")}
          <span className="ml-1.5 font-semibold tabular-nums text-primary">
            {formatMNT(grandTotal)}
          </span>
        </span>

        {/* Status actions */}
        {actions.map((action) => {
          const Icon = action.icon;
          const isDefault = (action.variant ?? "default") === "default";
          return (
            <Button
              key={action.key}
              variant={isDefault ? "default" : "outline"}
              className="flex-1 md:flex-initial md:px-5 h-9 text-xs font-semibold"
              onClick={action.onClick}
              disabled={saving}
            >
              <Icon className="size-4" />
              {t(action.labelKey)}
            </Button>
          );
        })}

        {/* Invoice */}
        {canInvoice &&
          (invoicePublicToken ? (
            <InvoiceQrPopover
              url={`${window.location.origin}/invoice/${invoicePublicToken}`}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
                onClick={() =>
                  window.open(
                    `${window.location.origin}/invoice/${invoicePublicToken}`,
                    "_blank",
                  )
                }
              >
                <FileText className="size-4" />
                {t("invoice")}
              </Button>
            </InvoiceQrPopover>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={onCreateInvoice}
              disabled={saving || creatingInvoice}
            >
              <FileText className="size-4" />
              {creatingInvoice ? t("creating") : t("createInvoice")}
            </Button>
          ))}

        {/* Cancel */}
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeStatus("Cancelled")}
            disabled={saving}
            className="h-9 px-3 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
          >
            <X className="size-4" />
            {t("cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}
