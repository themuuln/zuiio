"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  computeNextDueDate,
  computeNextDueKm,
  formatDate,
  formatKm,
} from "./_helpers";
import type { ServiceFormEntry } from "./_schema";

// ── Service Card Sub-Component ────────────────────────────

export function ServiceCard({
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

  const priorityBorderColors: Record<string, string> = {
    standard: "border-l-blue-400/50",
    important: "border-l-amber-400/60",
    urgent: "border-l-red-400/60",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/50 overflow-hidden transition-all duration-200 border-l-2",
        priorityBorderColors[entry.priority],
      )}
    >
      {/* Header — always visible */}
      <Button
        variant="ghost"
        type="button"
        onClick={() => onChange({ expanded: !entry.expanded })}
        className="w-full justify-between px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {entry.serviceName}
          </span>
          {/* Priority badge */}
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
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border/40 pt-2">
          {/* Intervals row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`post-service-interval-months-${entry.workOrderServiceId}`}
                className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServiceIntervalMonths")}
              </label>
              <Input
                id={`post-service-interval-months-${entry.workOrderServiceId}`}
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
              <label
                htmlFor={`post-service-interval-km-${entry.workOrderServiceId}`}
                className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServiceIntervalKm")}
              </label>
              <Input
                id={`post-service-interval-km-${entry.workOrderServiceId}`}
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

          {/* Next due */}
          {(nextDate || nextKm) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-2">
              <span className="font-medium">{t("postServiceNextDue")}:</span>
              {nextDate && <span>{formatDate(nextDate)}</span>}
              {nextDate && nextKm && <span>·</span>}
              {nextKm && <span>{formatKm(nextKm)} km</span>}
            </div>
          )}

          {/* Priority + Notes row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`post-service-priority-${entry.workOrderServiceId}`}
                className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServicePriority")}
              </label>
              <Select
                value={entry.priority}
                onValueChange={(val) => {
                  if (val)
                    onChange({
                      priority: val as "standard" | "important" | "urgent",
                    });
                }}
              >
                <SelectTrigger
                  id={`post-service-priority-${entry.workOrderServiceId}`}
                  className="h-8 text-xs"
                >
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
              <label
                htmlFor={`entry-notes-${entry.workOrderServiceId}`}
                className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                Notes
              </label>
              <Input
                id={`entry-notes-${entry.workOrderServiceId}`}
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
