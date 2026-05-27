"use client";

import { LayoutGrid, List, Minus, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateBayCount } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";
export type ColumnsMode = "auto" | "2" | "3";

interface BayViewToolbarProps {
  bayCount: number;
  onRefresh: () => void;
  onBayCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  columns: ColumnsMode;
  onColumnsChange: (mode: ColumnsMode) => void;
}

const COLUMNS_OPTIONS: { value: ColumnsMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

export function BayViewToolbar({
  bayCount,
  onRefresh,
  onBayCountChange,
  viewMode,
  onViewModeChange,
  columns,
  onColumnsChange,
}: BayViewToolbarProps) {
  const t = useTranslations("bayView");
  const [loading, setLoading] = useState(false);

  async function handleChangeCount(delta: number) {
    const newCount = bayCount + delta;
    if (newCount < 1 || newCount > 50) return;

    setLoading(true);
    try {
      await updateBayCount(newCount);
      onBayCountChange(newCount);
    } catch {
      // Silently fail — keep current count
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* View mode toggle */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5 ring-1 ring-border/30">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("grid")}
          aria-label={t("gridView")}
        >
          <LayoutGrid className="size-3.5" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("list")}
          aria-label={t("listView")}
        >
          <List className="size-3.5" />
        </Button>
      </div>

      {viewMode === "grid" && (
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5 ring-1 ring-border/30">
          {COLUMNS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={columns === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onColumnsChange(opt.value)}
              aria-label={`${opt.label} columns`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      <div className="h-5 w-px bg-border/40" />

      {/* Bay count control */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5 ring-1 ring-border/30">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => handleChangeCount(-1)}
          disabled={loading || bayCount <= 1}
          className="size-6"
          aria-label={t("decreaseBayCount")}
        >
          <Minus className="size-3" />
        </Button>
        <span className="flex h-6 min-w-7 items-center justify-center rounded-md bg-background px-1 text-[11px] font-semibold tabular-nums tracking-tight text-foreground shadow-sm ring-1 ring-border/50">
          {bayCount}
        </span>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => handleChangeCount(1)}
          disabled={loading || bayCount >= 50}
          className="size-6"
          aria-label={t("increaseBayCount")}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRefresh}
        aria-label={t("refresh")}
        className="size-6 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground active:scale-95"
      >
        <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      </Button>
    </div>
  );
}
