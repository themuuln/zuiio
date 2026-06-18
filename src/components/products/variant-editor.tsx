"use client";

import { Plus, Trash, X } from "@phosphor-icons/react";
import { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type LocalVariantGroup = {
  id: string;
  name: string;
  options: { id: string; value: string }[];
};

export type LocalVariant = {
  id: string;
  option_ids: string[];
  option_labels: string;
  sku: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
};

const PRESET_GROUP_SUGGESTIONS = [
  { name: "Хэмжээ", values: ["S", "M", "L", "XL"] },
  { name: "Өнгө", values: ["Улаан", "Цэнхэр", "Хар", "Цагаан"] },
  { name: "Материал", values: ["Хөвөн", "Полиэстр", "Ноос"] },
];

let groupIdCounter = 0;
let optionIdCounter = 0;
let variantIdCounter = 0;

function genGroupId() {
  return `g_${++groupIdCounter}`;
}
function genOptionId() {
  return `o_${++optionIdCounter}`;
}
function genVariantId() {
  return `v_${++variantIdCounter}`;
}

function computeCombinations(
  groups: LocalVariantGroup[],
): { option_ids: string[]; option_labels: string }[] {
  if (groups.length === 0) return [];

  const optionLists = groups.map((g) =>
    g.options.map((o) => ({ id: o.id, value: o.value })),
  );

  function cartesian(
    lists: { id: string; value: string }[][],
  ): { option_ids: string[]; option_labels: string }[] {
    if (lists.length === 0) return [{ option_ids: [], option_labels: "" }];
    const [first, ...rest] = lists;
    const restCombos = cartesian(rest);
    return first.flatMap((item) =>
      restCombos.map((combo) => ({
        option_ids: [item.id, ...combo.option_ids],
        option_labels: [item.value, ...(combo.option_labels ? [combo.option_labels] : [])].join(" / "),
      })),
    );
  }

  return cartesian(optionLists);
}

export function buildVariantFormData(
  formData: FormData,
  groups: LocalVariantGroup[],
  variants: LocalVariant[],
) {
  formData.append("variant_groups", JSON.stringify(groups));

  const variantsPayload = variants.map((v) => ({
    sku: v.sku,
    cost_price: v.cost_price,
    sale_price: v.sale_price,
    current_stock: v.current_stock,
    option_ids: v.option_ids,
  }));
  formData.append("variant_data", JSON.stringify(variantsPayload));
}

export function VariantEditor({
  groups,
  onGroupsChange,
}: {
  groups: LocalVariantGroup[];
  onGroupsChange: (groups: LocalVariantGroup[]) => void;
}) {
  const addGroup = useCallback(() => {
    const newGroup: LocalVariantGroup = {
      id: genGroupId(),
      name: "",
      options: [],
    };
    onGroupsChange([...groups, newGroup]);
  }, [groups, onGroupsChange]);

  const removeGroup = useCallback(
    (groupId: string) => {
      onGroupsChange(groups.filter((g) => g.id !== groupId));
    },
    [groups, onGroupsChange],
  );

  const updateGroupName = useCallback(
    (groupId: string, name: string) => {
      onGroupsChange(
        groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
      );
    },
    [groups, onGroupsChange],
  );

  const addOption = useCallback(
    (groupId: string) => {
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, options: [...g.options, { id: genOptionId(), value: "" }] }
            : g,
        ),
      );
    },
    [groups, onGroupsChange],
  );

  const updateOption = useCallback(
    (groupId: string, optionId: string, value: string) => {
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                options: g.options.map((o) =>
                  o.id === optionId ? { ...o, value } : o,
                ),
              }
            : g,
        ),
      );
    },
    [groups, onGroupsChange],
  );

  const removeOption = useCallback(
    (groupId: string, optionId: string) => {
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                options: g.options.filter((o) => o.id !== optionId),
              }
            : g,
        ),
      );
    },
    [groups, onGroupsChange],
  );

  const applyPreset = useCallback(
    (preset: { name: string; values: string[] }) => {
      const newGroup: LocalVariantGroup = {
        id: genGroupId(),
        name: preset.name,
        options: preset.values.map((v) => ({ id: genOptionId(), value: v })),
      };
      onGroupsChange([...groups, newGroup]);
    },
    [groups, onGroupsChange],
  );

  // build combinations and initial variants
  const combinations = useMemo(() => computeCombinations(groups), [groups]);

  const hasAllOptionsNamed = groups.every((g) =>
    g.options.every((o) => o.value.trim() !== ""),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Вариантууд</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGroup}
          >
            <Plus className="mr-1 size-3.5" />
            Бүлэг нэмэх
          </Button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Эсвэл бэлэн загвараас сонгох:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_GROUP_SUGGESTIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <Plus className="mr-1 size-3" />
                {preset.name} ({preset.values.join(", ")})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group editors */}
      {groups.map((group) => (
        <div key={group.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={group.name}
              onChange={(e) => updateGroupName(group.id, e.target.value)}
              placeholder="Бүлгийн нэр (жиш: Хэмжээ, Өнгө)"
              className="h-8 text-sm"
            />
            <button
              type="button"
              onClick={() => removeGroup(group.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
          <div className="ml-2 space-y-1.5">
            {group.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input
                  value={option.value}
                  onChange={(e) =>
                    updateOption(group.id, option.id, e.target.value)
                  }
                  placeholder="Опцийн утга (жиш: S, M, L)"
                  className="h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeOption(group.id, option.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(group.id)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="size-3" />
              Опцион нэмэх
            </button>
          </div>
        </div>
      ))}

      {/* Variant matrix */}
      {combinations.length > 0 && hasAllOptionsNamed && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Нийт {combinations.length} вариант
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Вариант</th>
                  <th className="w-20 py-1.5 px-1 font-medium">SKU</th>
                  <th className="w-20 py-1.5 px-1 font-medium">Өртөг</th>
                  <th className="w-20 py-1.5 px-1 font-medium">Зарах үнэ</th>
                  <th className="w-20 py-1.5 px-1 font-medium">Үлдэгдэл</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combo) => {
                  const key = combo.option_ids.join("-");
                  return (
                    <tr key={key} className="border-b last:border-b-0">
                      <td className="py-1.5 pr-2">
                        <Badge variant="outline" className="text-xs">
                          {combo.option_labels}
                        </Badge>
                      </td>
                      <td className="py-1.5 px-1">
                        <VariantCellInput name={`v_sku_${key}`} />
                      </td>
                      <td className="py-1.5 px-1">
                        <VariantCellInput
                          name={`v_cost_${key}`}
                          type="number"
                          defaultValue="0"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <VariantCellInput
                          name={`v_price_${key}`}
                          type="number"
                          defaultValue="0"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <VariantCellInput
                          name={`v_stock_${key}`}
                          type="number"
                          defaultValue="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Хоосон SKU-тай вариант автоматаар идэвхгүй болно.
          </p>
        </div>
      )}
    </div>
  );
}

function VariantCellInput({
  name,
  type = "text",
  defaultValue,
}: {
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <Input
      name={name}
      type={type}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "0.01" : undefined}
      defaultValue={defaultValue}
      className="h-7 w-full text-xs"
    />
  );
}
