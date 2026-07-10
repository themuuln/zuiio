"use client";

import { Columns3, LayoutGrid, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./_types";

const VIEW_OPTIONS: {
  mode: ViewMode;
  icon: typeof LayoutGrid;
  labelKey: string;
}[] = [
  { mode: "grid", icon: LayoutGrid, labelKey: "gridView" },
  { mode: "kanban", icon: Columns3, labelKey: "kanbanView" },
  { mode: "list", icon: List, labelKey: "listView" },
];

interface ViewSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  t: (key: string) => string;
}

export function ViewSelector({ viewMode, setViewMode, t }: ViewSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 p-1 h-8">
      {VIEW_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = viewMode === opt.mode;
        return (
          <Tooltip key={opt.mode}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setViewMode(opt.mode)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 text-xs font-semibold transition-all cursor-pointer h-full",
                    isActive
                      ? "bg-background text-foreground font-bold border border-border/30"
                      : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground",
                  )}
                />
              }
            >
              <Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-semibold">
              {t(opt.labelKey)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
