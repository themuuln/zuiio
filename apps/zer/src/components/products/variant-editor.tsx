"use client";

import {
  Calculator,
  CaretDown,
  CurrencyDollar,
  Plus,
  Sliders,
  Trash,
  X,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

function formatNum(v: string | number | null | undefined): string {
  if (v === "" || v === null || v === undefined) return "";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeNum(raw: string): string {
  const stripped = raw.replace(/[^\d.]/g, "");
  if (stripped === "" || stripped === ".") return "";
  const n = parseFloat(stripped);
  if (Number.isNaN(n)) return "";
  return String(n);
}

export type LocalVariantGroup = {
  id: string;
  name: string;
  options: { id: string; value: string }[];
};

export type LocalVariantData = {
  option_ids: string[];
  sku: string;
  cost_price: number | string;
  sale_price: number | string;
  current_stock: number | string;
  image_url: string | null;
};

const PRESET_GROUP_SUGGESTIONS = [
  { name: "Хэмжээ", values: ["S", "M", "L", "XL"] },
  { name: "Өнгө", values: ["Улаан", "Цэнхэр", "Хар", "Цагаан"] },
  { name: "Материал", values: ["Хөвөн", "Полиэстр", "Ноос"] },
];

let groupIdCounter = 0;
let optionIdCounter = 0;

function genGroupId() {
  return `g_${++groupIdCounter}`;
}
function genOptionId() {
  return `o_${++optionIdCounter}`;
}

export function computeCombinations(
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
        option_labels: [
          item.value,
          ...(combo.option_labels ? [combo.option_labels] : []),
        ].join(" / "),
      })),
    );
  }

  return cartesian(optionLists);
}

function QuickAddOptions({ onAdd }: { onAdd: (values: string[]) => void }) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    const values = input
      .split(/[,，\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return;
    onAdd(values);
    setInput("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Plus className="size-3" />
        Олон сонголт нэмэх
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Таслалаар тусгаарлан бичнэ үү (жиш: S, M, L, XL)"
          className="h-7 flex-1 text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") {
              setIsOpen(false);
              setInput("");
            }
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-7 items-center rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Нэмэх
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setInput("");
          }}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Утгуудыг таслалаар тусгаарлаж бичээд Enter дарна уу.
      </p>
    </div>
  );
}

function BulkActionBar({
  combinations,
  variantData,
  onVariantsChange,
  defaultValues,
}: {
  combinations: { option_ids: string[]; option_labels: string }[];
  variantData: LocalVariantData[];
  onVariantsChange: (data: LocalVariantData[]) => void;
  defaultValues?: {
    cost_price: number;
    sale_price: number;
    current_stock: number;
  };
}) {
  const [percentageInput, setPercentageInput] = useState("");
  const [showPercentageInput, setShowPercentageInput] = useState(false);

  const applyToAll = useCallback(
    (
      field: keyof Omit<LocalVariantData, "option_ids" | "sku">,
      value: number,
    ) => {
      const updated = variantData.map((d) => ({ ...d, [field]: value }));
      const existingKeys = new Set(
        variantData.map((d) => d.option_ids.join("-")),
      );
      for (const combo of combinations) {
        const key = combo.option_ids.join("-");
        if (!existingKeys.has(key)) {
          updated.push({
            option_ids: combo.option_ids,
            sku: "",
            cost_price: defaultValues?.cost_price ?? 0,
            sale_price: defaultValues?.sale_price ?? 0,
            current_stock: defaultValues?.current_stock ?? 0,
            image_url: null,
            [field]: value,
          });
        }
      }
      onVariantsChange(updated);
    },
    [variantData, combinations, onVariantsChange, defaultValues],
  );

  const applyParentPrices = useCallback(() => {
    if (!defaultValues) return;
    const updated = variantData.map((d) => ({
      ...d,
      cost_price: defaultValues.cost_price,
      sale_price: defaultValues.sale_price,
    }));
    const existingKeys = new Set(
      variantData.map((d) => d.option_ids.join("-")),
    );
    for (const combo of combinations) {
      const key = combo.option_ids.join("-");
      if (!existingKeys.has(key)) {
        updated.push({
          option_ids: combo.option_ids,
          sku: "",
          cost_price: defaultValues.cost_price,
          sale_price: defaultValues.sale_price,
          current_stock: defaultValues.current_stock,
          image_url: null,
        });
      }
    }
    onVariantsChange(updated);
  }, [variantData, combinations, onVariantsChange, defaultValues]);

  const applyPercentageToField = useCallback(
    (field: "cost_price" | "sale_price", percentage: number) => {
      const multiplier = 1 + percentage / 100;
      const updated = variantData.map((d) => ({
        ...d,
        [field]: Math.round(Number(d[field]) * multiplier * 100) / 100,
      }));
      const existingKeys = new Set(
        variantData.map((d) => d.option_ids.join("-")),
      );
      for (const combo of combinations) {
        const key = combo.option_ids.join("-");
        if (!existingKeys.has(key)) {
          updated.push({
            option_ids: combo.option_ids,
            sku: "",
            cost_price: defaultValues?.cost_price ?? 0,
            sale_price: defaultValues?.sale_price ?? 0,
            current_stock: defaultValues?.current_stock ?? 0,
            image_url: null,
            [field]: defaultValues?.[field] ?? 0,
          });
        }
      }
      onVariantsChange(updated);
      setShowPercentageInput(false);
      setPercentageInput("");
    },
    [variantData, combinations, onVariantsChange, defaultValues],
  );

  if (combinations.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 p-2">
      <span className="mr-1 text-[11px] font-medium text-muted-foreground">
        Масс үйлдэл:
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          >
            <Calculator className="size-3" />
            Бүгдэд үнэ тохируулах
            <CaretDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40 z-[100]">
          <DropdownMenuItem onSelect={applyParentPrices}>
            Эх үнээр тохируулах (өртөг + зарах)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              applyToAll("cost_price", defaultValues?.cost_price ?? 0)
            }
          >
            Бүх өртөг үнийг тохируулах
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              applyToAll("sale_price", defaultValues?.sale_price ?? 0)
            }
          >
            Бүх зарах үнийг тохируулах
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShowPercentageInput(true)}>
            Хувиар нэмэгдүүлэх/бууруулах
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          >
            <CurrencyDollar className="size-3" />
            Бүгдэд үлдэгдэл тохируулах
            <CaretDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40 z-[100]">
          <DropdownMenuItem onSelect={() => applyToAll("current_stock", 0)}>
            Бүгдийг 0 болгох
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              applyToAll("current_stock", defaultValues?.current_stock ?? 0)
            }
          >
            Эхний үлдэгдэлээр тохируулах
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showPercentageInput && (
        <div className="flex w-full items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground">
            Зарах үнэд хэдэн хувь нэмэх/хасах вэ?
          </span>
          <Input
            type="number"
            value={percentageInput}
            onChange={(e) => setPercentageInput(e.target.value)}
            placeholder="+10 эсвэл -10"
            className="h-7 w-24 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const pct = Number(percentageInput);
                if (!Number.isNaN(pct))
                  applyPercentageToField("sale_price", pct);
              }
              if (e.key === "Escape") {
                setShowPercentageInput(false);
                setPercentageInput("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const pct = Number(percentageInput);
              if (!Number.isNaN(pct)) applyPercentageToField("sale_price", pct);
            }}
            className="flex h-7 items-center rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Хэрэглэх
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPercentageInput(false);
              setPercentageInput("");
            }}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export type VariantSummary = {
  groupCount: number;
  optionCount: number;
  variantCount: number;
  totalStock: number;
  minSalePrice: number;
  maxSalePrice: number;
};

export function computeVariantSummary(data: {
  groups: LocalVariantGroup[];
  variantData: LocalVariantData[];
}): VariantSummary | null {
  const { groups, variantData } = data;
  if (groups.length === 0) return null;

  const totalOptions = groups.reduce((sum, g) => sum + g.options.length, 0);
  const combos = computeCombinations(groups);
  const salePrices = variantData
    .map((d) => Number(d.sale_price))
    .filter((p) => p > 0);
  const totalStock = variantData.reduce(
    (sum, d) => sum + Number(d.current_stock),
    0,
  );

  return {
    groupCount: groups.length,
    optionCount: totalOptions,
    variantCount: combos.length,
    totalStock,
    minSalePrice: salePrices.length > 0 ? Math.min(...salePrices) : 0,
    maxSalePrice: salePrices.length > 0 ? Math.max(...salePrices) : 0,
  };
}

export function VariantSummaryCard({
  groups,
  variantData,
}: {
  groups: LocalVariantGroup[];
  variantData: LocalVariantData[];
}) {
  const summary = useMemo(
    () => computeVariantSummary({ groups, variantData }),
    [groups, variantData],
  );

  if (!summary) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sliders className="size-3.5" />
        <span>Вариантын мэдээлэл</span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-center text-xs">
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {summary.variantCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Вариант</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {summary.groupCount}/{summary.optionCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Бүлэг/Сонголт</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {summary.totalStock.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Нийт үлдэгдэл</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(summary.minSalePrice)}
            {summary.maxSalePrice > summary.minSalePrice
              ? ` - ${formatCurrency(summary.maxSalePrice)}`
              : ""}
          </p>
          <p className="text-[10px] text-muted-foreground">Үнийн хүрээ</p>
        </div>
      </div>
    </div>
  );
}

export function VariantEditor({
  groups,
  onGroupsChange,
  defaultValues,
  variantData,
  onVariantsChange,
}: {
  groups: LocalVariantGroup[];
  onGroupsChange: (groups: LocalVariantGroup[]) => void;
  defaultValues?: {
    cost_price: number;
    sale_price: number;
    current_stock: number;
  };
  variantData: LocalVariantData[];
  onVariantsChange: (data: LocalVariantData[]) => void;
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
            ? {
                ...g,
                options: [...g.options, { id: genOptionId(), value: "" }],
              }
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

  const combinations = useMemo(() => computeCombinations(groups), [groups]);

  const variantDataMap = useMemo(() => {
    const map = new Map<string, LocalVariantData>();
    for (const d of variantData) {
      map.set(d.option_ids.join("-"), d);
    }
    return map;
  }, [variantData]);

  const handleVariantFieldChange = useCallback(
    (
      optionIds: string[],
      field: keyof Omit<LocalVariantData, "option_ids">,
      value: string | number,
    ) => {
      const key = optionIds.join("-");
      const existing = variantDataMap.get(key);
      const updated: LocalVariantData = {
        ...(existing ?? {
          option_ids: optionIds,
          sku: "",
          cost_price: defaultValues?.cost_price ?? 0,
          sale_price: defaultValues?.sale_price ?? 0,
          current_stock: defaultValues?.current_stock ?? 0,
          image_url: null,
        }),
        [field]: value,
      };
      const newData = variantData.filter((d) => d.option_ids.join("-") !== key);
      newData.push(updated);
      onVariantsChange(newData);
    },
    [variantDataMap, variantData, onVariantsChange, defaultValues],
  );

  const getVariantValue = useCallback(
    (optionIds: string[], field: keyof LocalVariantData): string | number => {
      const key = optionIds.join("-");
      const existing = variantDataMap.get(key);
      if (existing) {
        const val = existing[field];
        return typeof val === "string" || typeof val === "number" ? val : "";
      }
      switch (field) {
        case "cost_price":
          return defaultValues?.cost_price ?? 0;
        case "sale_price":
          return defaultValues?.sale_price ?? 0;
        case "current_stock":
          return defaultValues?.current_stock ?? 0;
        default:
          return "";
      }
    },
    [variantDataMap, defaultValues],
  );

  function VariantImageCell({
    imageUrl,
    onChange,
  }: {
    imageUrl: string | null;
    onChange: (url: string | null) => void;
  }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      setUploading(true);
      try {
        const { compressImage } = await import("@/lib/compress-image");
        const compressed = await compressImage(file);
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const ext = compressed.name.split(".").pop();
        const filePath = `variants/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("brand_assets")
          .upload(filePath, compressed);
        if (error) throw error;

        const { data } = supabase.storage
          .from("brand_assets")
          .getPublicUrl(filePath);
        onChange(data.publicUrl);
      } catch (err) {
        capture(err, { context: "variant-editor: image upload" });
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="relative flex items-center">
        {imageUrl ? (
          <div className="group relative">
            <img
              src={imageUrl}
              alt=""
              className="size-8 rounded border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ) : (
          <label className="flex size-8 cursor-pointer items-center justify-center rounded border border-dashed bg-muted/50 text-muted-foreground hover:bg-muted">
            {uploading ? (
              <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Plus className="size-3" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    );
  }

  const hasAllOptionsNamed = groups.every((g) =>
    g.options.every((o) => o.value.trim() !== ""),
  );

  const totals = useMemo(() => {
    if (combinations.length === 0) return null;
    const totalStock = variantData.reduce(
      (s, d) => s + Number(d.current_stock),
      0,
    );
    const avgCost =
      variantData.length > 0
        ? variantData.reduce((s, d) => s + Number(d.cost_price), 0) /
          variantData.length
        : 0;
    const avgSale =
      variantData.length > 0
        ? variantData.reduce((s, d) => s + Number(d.sale_price), 0) /
          variantData.length
        : 0;
    const activeVariants = variantData.filter(
      (d) => d.sku.trim() !== "",
    ).length;
    return { totalStock, avgCost, avgSale, activeVariants };
  }, [variantData, combinations.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Вариантууд</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addGroup}>
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
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}
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
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {group.options.length}
            </Badge>
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => addOption(group.id)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="size-3" />
                Опцион нэмэх
              </button>
              <QuickAddOptions
                onAdd={(values) => {
                  for (const v of values) {
                    const existing = group.options.find(
                      (o) => o.value.toLowerCase() === v.toLowerCase(),
                    );
                    if (!existing) {
                      onGroupsChange(
                        groups.map((g) =>
                          g.id === group.id
                            ? {
                                ...g,
                                options: [
                                  ...g.options,
                                  { id: genOptionId(), value: v },
                                ],
                              }
                            : g,
                        ),
                      );
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Variant matrix */}
      {combinations.length > 0 && hasAllOptionsNamed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Нийт {combinations.length} вариант
              {totals && (
                <span className="ml-2 text-[10px]">
                  (идэвхтэй: {totals.activeVariants})
                </span>
              )}
            </p>
          </div>

          <BulkActionBar
            combinations={combinations}
            variantData={variantData}
            onVariantsChange={onVariantsChange}
            defaultValues={defaultValues}
          />

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border">
            <table className="w-full min-w-[400px] text-xs">
              <thead>
                <tr className="sticky top-0 z-10 border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="py-2 pr-2 pl-3 font-medium">Вариант</th>
                  <th className="w-14 py-2 px-1 font-medium">Зураг</th>
                  <th className="w-20 py-2 px-1 font-medium">SKU</th>
                  <th className="w-20 py-2 px-1 font-medium">Өртөг</th>
                  <th className="w-20 py-2 px-1 font-medium">Зарах үнэ</th>
                  <th className="w-20 py-2 px-1 pr-3 font-medium">Үлдэгдэл</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combo, idx) => {
                  const key = combo.option_ids.join("-");
                  const hasSku =
                    (
                      getVariantValue(combo.option_ids, "sku") as string
                    ).trim() !== "";
                  return (
                    <tr
                      key={key}
                      className={`border-b last:border-b-0 transition-colors ${
                        idx % 2 === 1 ? "bg-muted/20" : ""
                      } ${!hasSku ? "opacity-60" : "hover:opacity-100"}`}
                    >
                      <td className="py-1.5 pr-2 pl-3">
                        <Badge
                          variant={hasSku ? "outline" : "secondary"}
                          className={`text-xs ${
                            !hasSku ? "text-muted-foreground" : ""
                          }`}
                        >
                          {combo.option_labels}
                        </Badge>
                      </td>
                      <td className="py-1.5 px-1">
                        <VariantImageCell
                          imageUrl={
                            (getVariantValue(combo.option_ids, "image_url") as
                              | string
                              | null) ?? null
                          }
                          onChange={(url) =>
                            handleVariantFieldChange(
                              combo.option_ids,
                              "image_url",
                              url as string | number,
                            )
                          }
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <Input
                          type="text"
                          value={
                            getVariantValue(combo.option_ids, "sku") as string
                          }
                          onChange={(e) =>
                            handleVariantFieldChange(
                              combo.option_ids,
                              "sku",
                              e.target.value,
                            )
                          }
                          placeholder="SKU"
                          className="h-7 w-full text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={formatNum(
                            getVariantValue(combo.option_ids, "cost_price"),
                          )}
                          onChange={(e) =>
                            handleVariantFieldChange(
                              combo.option_ids,
                              "cost_price",
                              normalizeNum(e.target.value),
                            )
                          }
                          className="h-7 w-full text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={formatNum(
                            getVariantValue(combo.option_ids, "sale_price"),
                          )}
                          onChange={(e) =>
                            handleVariantFieldChange(
                              combo.option_ids,
                              "sale_price",
                              normalizeNum(e.target.value),
                            )
                          }
                          className="h-7 w-full text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-1 pr-3">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={formatNum(
                            getVariantValue(combo.option_ids, "current_stock"),
                          )}
                          onChange={(e) =>
                            handleVariantFieldChange(
                              combo.option_ids,
                              "current_stock",
                              normalizeNum(e.target.value),
                            )
                          }
                          className="h-7 w-full text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {totals && (
                  <tr className="sticky bottom-0 border-t bg-muted/60 font-medium">
                    <td className="py-2 pr-2 pl-3 text-[11px] text-muted-foreground">
                      Нийт
                    </td>
                    <td className="py-2 px-1 text-[11px] text-muted-foreground">
                      {totals.activeVariants} ид.
                    </td>
                    <td className="py-2 px-1 text-[11px] text-muted-foreground">
                      Ø{totals.avgCost.toFixed(0)}
                    </td>
                    <td className="py-2 px-1 text-[11px] text-muted-foreground">
                      Ø{totals.avgSale.toFixed(0)}
                    </td>
                    <td className="py-2 px-1 pr-3 text-[11px] font-semibold text-foreground">
                      {totals.totalStock.toFixed(0)}
                    </td>
                  </tr>
                )}
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
