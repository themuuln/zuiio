"use client";

import { LayoutGrid, List, Minus, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateBayCount } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface BayViewToolbarProps {
  bayCount: number;
  onRefresh: () => void;
  onBayCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function BayViewToolbar({
  bayCount,
  onRefresh,
  onBayCountChange,
  viewMode,
  onViewModeChange,
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
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm shadow-black/5 backdrop-blur-sm">
      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "rounded-lg p-2.5 transition-all duration-200 hover:scale-105 active:scale-95",
            viewMode === "grid"
              ? "bg-background text-primary shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
          )}
          aria-label={t("gridView")}
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={cn(
            "rounded-lg p-2.5 transition-all duration-200 hover:scale-105 active:scale-95",
            viewMode === "list"
              ? "bg-background text-primary shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
          )}
          aria-label={t("listView")}
        >
          <List className="size-4" />
        </button>
      </div>

      {/* Subtle divider */}
      <div className="h-8 w-px bg-border/70" aria-hidden="true" />

      {/* Bay count control */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => handleChangeCount(-1)}
          disabled={loading || bayCount <= 1}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-background/80 hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          aria-label={t("decreaseBayCount")}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="flex h-9 min-w-10 items-center justify-center rounded-lg bg-background px-2 text-sm font-bold tabular-nums text-foreground shadow-sm ring-1 ring-border/70">
          {bayCount}
        </span>
        <button
          type="button"
          onClick={() => handleChangeCount(1)}
          disabled={loading || bayCount >= 50}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-background/80 hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          aria-label={t("increaseBayCount")}
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        aria-label={t("refresh")}
        className="size-10 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95"
      >
        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
      </Button>
    </div>
  );
}
