"use client";

import { FunnelSimple, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FilterableDef = {
  id: string;
  name: string;
  slug: string;
  value_type: "text" | "number" | "boolean" | "select";
  options: string[] | null;
  unit: string | null;
};

export type AttributeFilters = Record<
  string,
  string | { min?: number; max?: number }
>;

interface AttributeFilterPanelProps {
  categoryId?: string | null;
  filters: AttributeFilters;
  onChange: (filters: AttributeFilters) => void;
}

export function AttributeFilterPanel({
  categoryId,
  filters,
  onChange,
}: AttributeFilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const supabase = createClient();

  const { data: definitions = [] } = useQuery({
    queryKey: ["filterable-definitions", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("product_attribute_definitions")
        .select("*")
        .eq("is_filterable", true)
        .order("sort_order");

      if (categoryId) {
        // Get definitions linked to this category or global
        const { data: linked } = await supabase
          .from("product_attribute_categories")
          .select("attribute_definition_id")
          .eq("category_id", categoryId);

        const linkedIds = (linked ?? []).map((l) => l.attribute_definition_id);

        if (linkedIds.length > 0) {
          const { data: allDefs } = await supabase
            .from("product_attribute_definitions")
            .select("id, product_attribute_categories(id)")
            .eq("is_filterable", true);

          const allDefIds = (allDefs ?? []).map((d) => d.id);
          const globalIds = allDefIds.filter((id) => !linkedIds.includes(id));
          query = query.or(`id.in.(${[...linkedIds, ...globalIds].join(",")})`);
        } else {
          const { data: allDefs } = await supabase
            .from("product_attribute_definitions")
            .select("id, product_attribute_categories(id)")
            .eq("is_filterable", true);

          const globalIds = (allDefs ?? [])
            .filter((d) => !d.product_attribute_categories?.length)
            .map((d) => d.id);

          if (globalIds.length === 0) return [];
          query = query.in("id", globalIds);
        }
      }

      const { data, error } = await query;
      if (error) return [];
      return (data ?? []) as FilterableDef[];
    },
    staleTime: 60_000,
  });

  if (definitions.length === 0) return null;

  const activeCount = Object.keys(filters).length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          activeCount > 0
            ? "border-primary bg-primary/5 text-primary"
            : "hover:bg-muted/50",
        )}
      >
        <FunnelSimple className="size-4" />
        Шүүлтүүр
        {activeCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {expanded && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Шүүлтүүр</Label>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({})}
                className="h-7 text-xs"
              >
                <X className="mr-1 size-3" /> Цэвэрлэх
              </Button>
            )}
          </div>

          {definitions.map((def) => (
            <FilterField
              key={def.id}
              definition={def}
              value={filters[def.slug]}
              onChange={(v) => {
                const next = { ...filters };
                if (v === null || v === undefined) {
                  delete next[def.slug];
                } else {
                  next[def.slug] = v;
                }
                onChange(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterField({
  definition,
  value,
  onChange,
}: {
  definition: FilterableDef;
  value: AttributeFilters[string] | undefined;
  onChange: (v: string | { min?: number; max?: number } | null) => void;
}) {
  switch (definition.value_type) {
    case "select":
    case "boolean": {
      const selectedValues =
        typeof value === "string" ? value.split(",").filter(Boolean) : [];
      const options =
        definition.value_type === "boolean"
          ? ["Тийм", "Үгүй"]
          : (definition.options ?? []);

      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {definition.name}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = selectedValues.includes(opt)
                    ? selectedValues.filter((v) => v !== opt)
                    : [...selectedValues, opt];
                  onChange(next.length > 0 ? next.join(",") : null);
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  selectedValues.includes(opt)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted/50",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "number": {
      const range = typeof value === "object" && value !== null ? value : {};
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {definition.name}
            {definition.unit && ` (${definition.unit})`}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Доод"
              value={range.min ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                const max = range.max;
                onChange(v || max ? { min: v, max } : null);
              }}
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="Дээд"
              value={range.max ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                const min = range.min;
                onChange(min || v ? { min, max: v } : null);
              }}
              className="h-8 text-xs"
            />
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
