"use client";

import { useState } from "react";
import {
  cancelReturn,
  completeReturn,
} from "@/app/(dashboard)/returns/actions";
import type { ReturnRow } from "@/app/(dashboard)/returns/page";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { formatCurrency, formatDate } from "@/lib/format";

const typeLabels: Record<string, string> = {
  sales_return: "Борлуулалтын буцаалт",
  purchase_return: "Худалдан авалтын буцаалт",
};

const statusLabels: Record<string, string> = {
  draft: "Ноорог",
  completed: "Гүйцэтгэсэн",
  cancelled: "Цуцлагдсан",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  draft: "secondary",
  cancelled: "destructive",
};

export function ReturnDetailDrawer({
  returnData,
  open,
  onOpenChange,
}: {
  returnData: ReturnRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!returnData) return;
    setActionLoading("complete");
    setActionError(null);
    const result = await completeReturn(returnData.id);
    if (result?.error) {
      setActionError(result.error);
    } else {
      onOpenChange(false);
    }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    if (!returnData) return;
    setActionLoading("cancel");
    setActionError(null);
    const result = await cancelReturn(returnData.id);
    if (result?.error) {
      setActionError(result.error);
    } else {
      onOpenChange(false);
    }
    setActionLoading(null);
  };

  const isDraft = returnData?.status === "draft";

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setActionError(null);
        }
      }}
      title={`Буцаалт #${returnData?.return_number ?? ""}`}
      description="Буцаалтын дэлгэрэнгүй мэдээлэл"
      panelWidth="32rem"
    >
      {!returnData ? (
        <p className="text-sm text-muted-foreground">Буцаалт олдсонгүй.</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Төрөл:</span>
              <p className="font-medium">
                {typeLabels[returnData.type] ?? returnData.type}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Огноо:</span>
              <p className="font-medium">
                {formatDate(returnData.return_date)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Харилцагч:</span>
              <p className="font-medium">{returnData.contact_name ?? "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Статус:</span>
              <p>
                <Badge variant={statusVariants[returnData.status] ?? "outline"}>
                  {statusLabels[returnData.status] ?? returnData.status}
                </Badge>
              </p>
            </div>
            {returnData.reason && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Шалтгаан:</span>
                <p className="font-medium">{returnData.reason}</p>
              </div>
            )}
          </div>

          {/* Items table - if we had items data, we'd show them */}
          {/* For now, show total amount */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Нийт дүн:</span>
              <span className="text-lg font-semibold">
                {formatCurrency(returnData.total_amount)}
              </span>
            </div>
          </div>

          {/* Action error */}
          <ErrorBanner error={actionError} />

          {/* Actions */}
          {isDraft && (
            <div className="flex items-center gap-3 border-t pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading === "cancel"}
                className={buttonVariants({ variant: "secondary" })}
              >
                {actionLoading === "cancel" ? "Цуцалж байна..." : "Цуцлах"}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={actionLoading === "complete"}
                className={buttonVariants({ variant: "default" })}
              >
                {actionLoading === "complete"
                  ? "Гүйцэтгэж байна..."
                  : "Гүйцэтгэх"}
              </button>
            </div>
          )}
        </div>
      )}
    </SlideInDrawer>
  );
}
