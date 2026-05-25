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

interface DrawerFooterProps {
  wo: WorkOrderDetail;
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

export function DrawerFooter({
  wo,
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
  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2 flex flex-col gap-2">
      {/* Status change confirmation */}
      {confirmStatus && (
        <Alert variant="destructive">
          <AlertTriangle className="size-3.5" />
          <AlertTitle className="text-[11px]">
            {t("statusNotesGenericTitle", { status: confirmStatus })}?
          </AlertTitle>
          <AlertDescription className="text-[10px]">
            {confirmStatus === "Completed"
              ? t("confirmComplete")
              : t("confirmCancel")}
          </AlertDescription>
          <div className="col-span-full mt-1 flex flex-col gap-1.5">
            <Input
              placeholder={t("addNotesOptional")}
              value={statusNotes}
              onChange={(e) => onStatusNotesChange(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-1.5 justify-end">
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
                variant={confirmStatus === "Cancelled" ? "destructive" : "default"}
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

      {/* Primary status flow action */}
      <div className="flex gap-1.5">
        {wo.status === "New" && (
          <Button
            className="flex-1 h-9 text-xs font-semibold"
            onClick={() => onChangeStatus("Diagnosing")}
            disabled={saving}
          >
            <ArrowRight className="size-3.5" />
            {t("startDiagnosing")}
          </Button>
        )}
        {wo.status === "Diagnosing" && (
          <Button
            className="flex-1 h-9 text-xs font-semibold"
            onClick={() => onChangeStatus("In Progress")}
            disabled={saving}
          >
            <ArrowRight className="size-3.5" />
            {t("startWork")}
          </Button>
        )}
        {wo.status === "In Progress" && (
          <>
            <Button
              className="flex-1 h-9 text-xs font-semibold"
              onClick={onMarkReady}
              disabled={saving}
            >
              <CheckCircle2 className="size-3.5" />
              {t("markReady")}
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 text-xs font-semibold"
              onClick={onComplete}
              disabled={saving}
            >
              <CheckCircle2 className="size-3.5" />
              {t("complete")}
            </Button>
          </>
        )}
        {wo.status === "Ready for Pickup" && (
          <Button
            className="flex-1 h-9 text-xs font-semibold"
            onClick={onComplete}
            disabled={saving}
          >
            <CheckCircle2 className="size-3.5" />
            {t("complete")}
          </Button>
        )}
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-1.5">
        {/* Cancel */}
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeStatus("Cancelled")}
            disabled={saving}
            className="h-7 text-[10px] text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
          >
            <X className="size-3" />
            {t("cancel")}
          </Button>
        )}

        {/* Invoice */}
        {canInvoice && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px]"
            onClick={onCreateInvoice}
            disabled={saving || creatingInvoice}
          >
            <FileText className="size-3" />
            {creatingInvoice ? t("creating") : t("invoice")}
          </Button>
        )}
      </div>
    </div>
  );
}
