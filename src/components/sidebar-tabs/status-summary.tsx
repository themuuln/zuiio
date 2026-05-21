"use client";

import { Badge } from "@/components/ui/badge";

interface StatusCount {
  label: string;
  count: number;
  color?: "default" | "secondary" | "destructive" | "outline";
}

export function StatusSummary({
  items,
  title,
}: {
  items: StatusCount[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-md border border-border/50 bg-card px-2.5 py-1.5"
        >
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <Badge
            variant={item.color ?? "secondary"}
            className="text-[10px] h-4 px-1.5 font-medium"
          >
            {item.count}
          </Badge>
        </div>
      ))}
    </div>
  );
}
