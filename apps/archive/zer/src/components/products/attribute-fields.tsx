"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AttributeDefinition = {
  id: string;
  name: string;
  slug: string;
  value_type: "text" | "number" | "boolean" | "select";
  unit: string | null;
  options: string[] | null;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
};

export type AttributeValues = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/*  Fetch definitions for a category                                   */
/* ------------------------------------------------------------------ */

function useAttributeDefinitions(categoryId?: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["attribute-definitions", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("product_attribute_definitions")
        .select("*")
        .order("sort_order");

      if (categoryId) {
        // Get definitions that are either global (no category link) or linked to this category
        const { data: linked } = await supabase
          .from("product_attribute_categories")
          .select("attribute_definition_id")
          .eq("category_id", categoryId);

        const linkedIds = (linked ?? []).map((l) => l.attribute_definition_id);

        if (linkedIds.length > 0) {
          // Include linked defs + global defs (no category link at all)
          // First find global defs (those with no category links)
          const { data: allDefs } = await supabase
            .from("product_attribute_definitions")
            .select("id");

          const allDefIds = (allDefs ?? []).map((d) => d.id);
          const globalIds = allDefIds.filter((id) => !linkedIds.includes(id));

          query = query.or(`id.in.(${[...linkedIds, ...globalIds].join(",")})`);
        } else {
          // No definitions linked to this category — only show global ones
          // Global = definitions with zero category links
          const { data: allDefs } = await supabase
            .from("product_attribute_definitions")
            .select("id, product_attribute_categories(id)");

          const globalIds = (allDefs ?? [])
            .filter((d) => !d.product_attribute_categories?.length)
            .map((d) => d.id);

          if (globalIds.length === 0) {
            return [];
          }
          query = query.in("id", globalIds);
        }
      } else {
        // No category selected — show all definitions
        // Filter to only global (no category link) or all if none have links
        const { data: allDefs } = await supabase
          .from("product_attribute_definitions")
          .select("id, product_attribute_categories(id)");

        const hasAnyLinks = (allDefs ?? []).some(
          (d) => d.product_attribute_categories?.length,
        );

        if (hasAnyLinks) {
          // Only show global defs (no category link)
          const globalIds = (allDefs ?? [])
            .filter((d) => !d.product_attribute_categories?.length)
            .map((d) => d.id);

          if (globalIds.length === 0) return [];
          query = query.in("id", globalIds);
        }
      }

      const { data, error } = await query;
      if (error) return [];
      return (data ?? []) as AttributeDefinition[];
    },
    staleTime: 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface AttributeFieldsProps {
  categoryId?: string | null;
  values: AttributeValues;
  onChange: (values: AttributeValues) => void;
  errors?: Record<string, string>;
}

export function AttributeFields({
  categoryId,
  values,
  onChange,
  errors,
}: AttributeFieldsProps) {
  const { data: definitions = [], isPending } =
    useAttributeDefinitions(categoryId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Label>Нэмэлт мэдээлэл</Label>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (definitions.length === 0) return null;

  const handleChange = (slug: string, value: unknown) => {
    onChange({ ...values, [slug]: value });
  };

  return (
    <div className="space-y-3">
      <Label>Нэмэлт мэдээлэл</Label>
      <div className="space-y-3">
        {definitions.map((def) => (
          <div key={def.id} className="space-y-1">
            <Label
              htmlFor={`attr-${def.slug}`}
              className="text-xs text-muted-foreground"
            >
              {def.name}
              {def.is_required && (
                <span className="ml-1 text-destructive">*</span>
              )}
              {def.unit && (
                <span className="ml-1 text-muted-foreground">({def.unit})</span>
              )}
            </Label>
            <AttributeInput
              definition={def}
              value={values[def.slug]}
              onChange={(v) => handleChange(def.slug, v)}
            />
            {errors?.[def.slug] && (
              <p className="text-xs text-destructive">{errors[def.slug]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Input by value_type                                                */
/* ------------------------------------------------------------------ */

function AttributeInput({
  definition,
  value,
  onChange,
}: {
  definition: AttributeDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (definition.value_type) {
    case "text":
      return (
        <Input
          id={`attr-${definition.slug}`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={definition.unit ? `${definition.unit}-аар` : ""}
        />
      );

    case "number":
      return (
        <Input
          id={`attr-${definition.slug}`}
          type="number"
          step="any"
          value={value != null ? String(value) : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v !== "" ? Number(v) : null);
          }}
          placeholder={definition.unit ? `${definition.unit}-аар` : ""}
        />
      );

    case "boolean":
      return (
        <select
          id={`attr-${definition.slug}`}
          value={value != null ? String(value) : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : v === "true");
          }}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">—</option>
          <option value="true">Тийм</option>
          <option value="false">Үгүй</option>
        </select>
      );

    case "select":
      return (
        <select
          id={`attr-${definition.slug}`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">— Сонгох —</option>
          {definition.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Validation (server-side helper)                                    */
/* ------------------------------------------------------------------ */

export function validateRequiredAttributes(
  definitions: AttributeDefinition[],
  values: AttributeValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const def of definitions) {
    if (
      def.is_required &&
      (values[def.slug] == null || values[def.slug] === "")
    ) {
      errors[def.slug] = `"${def.name}" шаардлагатай.`;
    }
  }
  return errors;
}
