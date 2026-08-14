"use client";

import { Package, User, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import type { WorkOrderServiceHistoryEntry } from "@/lib/types";

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: { name: string; price: number } | null;
  entry: WorkOrderServiceHistoryEntry | null;
}

export function ServiceDetailDialog({
  open,
  onOpenChange,
  service,
  entry,
}: ServiceDetailDialogProps) {
  const t = useTranslations("bayView");

  if (!service || !entry) return null;

  const formattedDate = new Date(entry.created_at).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground/60" />
            {service.name}
          </DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Price */}
          {service.price > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("servicePrice")}
              </span>
              <span className="text-sm font-semibold font-mono tabular-nums">
                {service.price.toLocaleString()}₮
              </span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statusLabel")}
            </span>
            <Badge variant="secondary" className="text-xs">
              {entry.status}
            </Badge>
          </div>

          {/* Parts */}
          {entry.parts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("partsUsed")}
              </span>
              <div className="flex flex-col gap-1">
                {entry.parts.map((part) => (
                  <div
                    key={`${part.name}-${part.quantity}-${part.price}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      <Package className="size-3 text-muted-foreground/60" />
                      <span className="truncate">{part.name}</span>
                      {part.quantity > 1 && (
                        <span className="text-muted-foreground/60">
                          ×{part.quantity}
                        </span>
                      )}
                    </span>
                    {part.price > 0 && (
                      <span className="shrink-0 font-mono text-muted-foreground/80 tabular-nums">
                        {part.price.toLocaleString()}₮
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaint */}
          {entry.complaint && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("complaint")}
              </span>
              <Typography.Muted className="text-xs break-words">
                {entry.complaint}
              </Typography.Muted>
            </div>
          )}

          {/* Diagnosis */}
          {entry.diagnosis && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("diagnosis")}
              </span>
              <Typography.Muted className="text-xs break-words">
                {entry.diagnosis}
              </Typography.Muted>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("internalNotes")}
              </span>
              <Typography.Muted className="text-xs break-words">
                {entry.notes}
              </Typography.Muted>
            </div>
          )}

          {/* Mechanic + Helpers */}
          {(entry.mechanic_name || entry.helpers.length > 0) && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Team
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {entry.mechanic_name && (
                  <span className="flex items-center gap-1 text-foreground/80">
                    <User className="size-3" />
                    {entry.mechanic_name}
                  </span>
                )}
                {entry.helpers.map((h) => (
                  <span
                    key={h.id}
                    className="flex items-center gap-1 text-muted-foreground/70"
                  >
                    <User className="size-3" />
                    {h.full_name ?? "Unknown"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work order total */}
          {entry.total > 0 && (
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("workOrderTotal")}
              </span>
              <span className="text-sm font-semibold font-mono tabular-nums">
                {entry.total.toLocaleString()} MNT
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
