"use client";

import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SectionCardProps {
  /** Icon component (e.g. Wrench, Package) */
  icon: LucideIcon;
  /** Section title */
  title: string;
  /** Number badge (hidden when null) */
  count?: number | null;
  /** Empty state message (shown when empty and not adding) */
  emptyMessage?: string;
  /** Whether the section is empty */
  isEmpty?: boolean;
  /** Whether the add form is open (prevents showing empty state) */
  isAdding?: boolean;
  /** Add button label */
  addLabel: string;
  /** Called when add button is clicked */
  onToggleAdd: () => void;
  /** Section content */
  children: ReactNode;
}

export function SectionCard({
  icon: Icon,
  title,
  count,
  emptyMessage,
  isEmpty,
  isAdding,
  addLabel,
  onToggleAdd,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-5 rounded-md bg-primary/10">
            <Icon className="size-3 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {count != null && count > 0 && (
            <Badge variant="outline">{count}</Badge>
          )}
        </div>
      </div>

      {/* Content or empty state */}
      {!isEmpty || isAdding ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <Icon className="size-4 text-muted-foreground/40 mb-2" />
          <span className="text-xs text-muted-foreground">{emptyMessage}</span>
        </div>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        onClick={onToggleAdd}
        className="mt-2 w-full border-dashed text-xs h-9 gap-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200"
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </section>
  );
}
