"use client";

import type { Template } from "@/types/template";
import { CATEGORY_LABELS } from "@/types/template";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template;
  onUseTemplate?: (template: Template) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  welcome: "bg-blue/10 text-blue border-blue/30",
  support: "bg-purple/10 text-purple border-purple/30",
  sales: "bg-green/10 text-green border-green/30",
  notifications: "bg-orange/10 text-orange border-orange/30",
  general: "bg-gray/10 text-gray border-gray/30",
};

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}

function formatUsageCount(count: number): string {
  if (count === 0) return "Never used";
  if (count === 1) return "Used 1 time";
  return `Used ${count} times`;
}

export function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-hover hover:bg-surface-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="m-0 text-sm font-semibold text-text line-clamp-2">
          {template.name}
        </h4>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize whitespace-nowrap",
            CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general,
          )}
        >
          {formatCategory(template.category)}
        </span>
      </div>

      <p className="m-0 text-xs text-text-muted line-clamp-2 leading-relaxed">
        {template.description || "No description"}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-text-muted/60">
          {formatUsageCount(template.usageCount)}
        </span>

        {onUseTemplate && (
          <button
            type="button"
            className="h-7 rounded-lg border border-accent/50 bg-accent/10 px-2.5 text-[11px] font-medium text-text transition-all hover:bg-accent/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate(template);
            }}
          >
            Use Template
          </button>
        )}
      </div>
    </div>
  );
}
