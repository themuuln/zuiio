"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkOrderDetail } from "@/lib/types";
import { InvoiceQrPopover } from "./_invoice-qr-popover";

// ─── Props ───────────────────────────────────────────────────────

interface DrawerFooterProps {
  wo: WorkOrderDetail;
  invoicePublicToken: string | null;
  saving: boolean;
  pendingAction?: string | null;
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
  invoicePublicToken,
  saving,
  pendingAction,
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

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-border/70 bg-card px-4 py-3">
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Secondary actions — left-aligned */}
        {(canInvoice || canCancel) && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Invoice */}
            {canInvoice &&
              (invoicePublicToken ? (
                <InvoiceQrPopover
                  url={`${window.location.origin}/invoice/${invoicePublicToken}`}
                >
                  <Button
                    variant="outline"
                    className="h-10 px-3 text-xs"
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
                  className="h-10 px-3 text-xs"
                  onClick={onCreateInvoice}
                  disabled={saving || creatingInvoice}
                >
                  <FileText className="size-4" />
                  {creatingInvoice ? t("creating") : t("createInvoice")}
                </Button>
              ))}

            {/* Divider before cancel */}
            {canInvoice && canCancel && <div className="w-px h-5 bg-border" />}

            {/* Cancel */}
            {canCancel && (
              <Button
                variant="ghost"
                onClick={() => onChangeStatus("Cancelled")}
                disabled={saving}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
                {t("cancel")}
              </Button>
            )}
          </div>
        )}

        {/* Primary status actions — right-aligned */}
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          {actions.map((action) => {
            const Icon = action.icon;
            const isDefault = (action.variant ?? "default") === "default";
            const isPending = pendingAction === action.key;
            return (
              <Button
                key={action.key}
                variant={isDefault ? "default" : "outline"}
                className="h-11 flex-1 px-4 text-xs font-semibold sm:flex-none"
                onClick={action.onClick}
                disabled={saving || isPending}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Icon className="size-4" />
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
