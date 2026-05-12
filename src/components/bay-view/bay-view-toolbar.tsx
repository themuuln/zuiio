"use client";

import { LayoutGrid, List, Minus, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateBayCount } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

interface BayViewToolbarProps {
  bayCount: number;
  onRefresh: () => void;
  onBayCountChange: (count: number) => void;
}

export function BayViewToolbar({
  bayCount,
  onRefresh,
  onBayCountChange,
}: BayViewToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
    <div className="flex items-center gap-3">
      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
        <button
          type="button"
          onClick={() => setViewMode("grid")}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            viewMode === "grid"
              ? "bg-background shadow-sm text-primary"
              : "hover:bg-background text-muted-foreground",
          )}
          aria-label="Grid view"
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            viewMode === "list"
              ? "bg-background shadow-sm text-primary"
              : "hover:bg-background text-muted-foreground",
          )}
          aria-label="List view"
        >
          <List className="size-4" />
        </button>
      </div>

      {/* Bay count control */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
        <button
          type="button"
          onClick={() => handleChangeCount(-1)}
          disabled={loading || bayCount <= 1}
          className="rounded-md p-1.5 hover:bg-background transition-colors disabled:opacity-30"
          aria-label="Decrease bay count"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
          {bayCount}
        </span>
        <button
          type="button"
          onClick={() => handleChangeCount(1)}
          disabled={loading || bayCount >= 50}
          className="rounded-md p-1.5 hover:bg-background transition-colors disabled:opacity-30"
          aria-label="Increase bay count"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        aria-label="Refresh bay view"
        className="size-8"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );
}
