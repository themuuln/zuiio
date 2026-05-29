"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreatePart } from "@/lib/queries/use-wizard-data";
import { Typography } from "@/components/ui/typography";
import type { PartsCatalogItem, CreatePartParams } from "@/lib/types";

export type PartFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreatePartParams>;
  onSuccess?: (part: PartsCatalogItem) => void;
  onCancel?: () => void;
};

const initialForm: CreatePartParams = {
  name: "",
  name_mn: "",
  part_number: "",
  category: "",
  description: "",
  unit: "piece",
  default_price: undefined,
  purchase_price: undefined,
};

export function PartForm({
  mode = "full",
  initialData,
  onSuccess,
  onCancel,
}: PartFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("inventory");
  const commonT = useTranslations("common");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [form, setForm] = useState<CreatePartParams>({
    ...initialForm,
    ...initialData,
  });

  const [priceInput, setPriceInput] = useState(
    initialData?.default_price !== undefined
      ? String(initialData.default_price)
      : "",
  );
  const [purchasePriceInput, setPurchasePriceInput] = useState(
    initialData?.purchase_price !== undefined
      ? String(initialData.purchase_price)
      : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createPartMutation = useCreatePart(orgId);

  // Sync mode if prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Clear errors on input or mode changes
  useEffect(() => {
    setError(null);
    setFieldErrors({});
  }, [form, currentMode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orgId) {
      setError("No organization selected");
      return;
    }

    // Validation
    const errors: Record<string, string> = {};

    if (!form.name?.trim()) {
      errors.name = "Part name is required";
    }

    const price = priceInput.trim() ? parseFloat(priceInput) : undefined;
    if (price !== undefined && (isNaN(price) || price < 0)) {
      errors.default_price = "Enter a valid default price";
    }

    const purchasePrice = purchasePriceInput.trim()
      ? parseFloat(purchasePriceInput)
      : undefined;
    if (
      purchasePrice !== undefined &&
      (isNaN(purchasePrice) || purchasePrice < 0)
    ) {
      errors.purchase_price = "Enter a valid purchase price";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);

    try {
      const payload: CreatePartParams = {
        name: form.name.trim(),
        part_number: form.part_number?.trim() || undefined,
        default_price: price,
        name_mn:
          currentMode === "full"
            ? form.name_mn?.trim() || undefined
            : undefined,
        category:
          currentMode === "full"
            ? form.category?.trim() || undefined
            : undefined,
        description:
          currentMode === "full"
            ? form.description?.trim() || undefined
            : undefined,
        unit: currentMode === "full" ? form.unit?.trim() || "piece" : "piece",
        purchase_price: currentMode === "full" ? purchasePrice : undefined,
      };

      const part = await createPartMutation.mutateAsync(payload);
      onSuccess?.(part);
    } catch (err: any) {
      setError(err.message || "Failed to save part");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ── Mode Toggle Tabs ── */}
      <Tabs
        value={currentMode}
        onValueChange={(val) => setCurrentMode(val as "quick" | "full")}
        className="w-full shrink-0"
      >
        <TabsList className="flex w-full h-9 p-0.5 rounded-lg bg-muted border border-border">
          <TabsTrigger
            value="quick"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            Quick Add
          </TabsTrigger>
          <TabsTrigger
            value="full"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            Full Details
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label
              className="mb-1 block text-sm font-medium"
              htmlFor="part-name"
            >
              Part Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="part-name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              className={`h-11 ${fieldErrors.name ? "border-destructive" : ""}`}
              placeholder="e.g. Oil Filter"
              autoFocus
            />
            {fieldErrors.name && (
              <Typography.Text className="text-xs text-destructive mt-1">
                {fieldErrors.name}
              </Typography.Text>
            )}
          </div>

          <div>
            <Label
              className="mb-1 block text-sm font-medium"
              htmlFor="part-number"
            >
              Part Number
            </Label>
            <Input
              id="part-number"
              value={form.part_number || ""}
              onChange={(e) =>
                setForm((c) => ({ ...c, part_number: e.target.value }))
              }
              className="h-11"
              placeholder="e.g. OF-101"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label
              className="mb-1 block text-sm font-medium"
              htmlFor="part-default-price"
            >
              Default Selling Price (₮)
            </Label>
            <Input
              id="part-default-price"
              type="number"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className={`h-11 ${fieldErrors.default_price ? "border-destructive" : ""}`}
              placeholder="15000"
            />
            {fieldErrors.default_price && (
              <Typography.Text className="text-xs text-destructive mt-1">
                {fieldErrors.default_price}
              </Typography.Text>
            )}
          </div>

          {currentMode === "full" && (
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="part-purchase-price"
              >
                Purchase Price (₮)
              </Label>
              <Input
                id="part-purchase-price"
                type="number"
                min="0"
                value={purchasePriceInput}
                onChange={(e) => setPurchasePriceInput(e.target.value)}
                className={`h-11 ${fieldErrors.purchase_price ? "border-destructive" : ""}`}
                placeholder="10000"
              />
              {fieldErrors.purchase_price && (
                <Typography.Text className="text-xs text-destructive mt-1">
                  {fieldErrors.purchase_price}
                </Typography.Text>
              )}
            </div>
          )}
        </div>

        {currentMode === "full" && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="part-name-mn"
              >
                Mongolian Name (Монгол нэр)
              </Label>
              <Input
                id="part-name-mn"
                value={form.name_mn || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, name_mn: e.target.value }))
                }
                className="h-11"
                placeholder="Тосны шүүлтүүр"
              />
            </div>

            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="part-category"
              >
                Category
              </Label>
              <Input
                id="part-category"
                value={form.category || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, category: e.target.value }))
                }
                className="h-11"
                placeholder="e.g. Filters, Suspension"
              />
            </div>

            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="part-unit"
              >
                Unit
              </Label>
              <Input
                id="part-unit"
                value={form.unit || "piece"}
                onChange={(e) =>
                  setForm((c) => ({ ...c, unit: e.target.value }))
                }
                className="h-11"
                placeholder="e.g. piece, liter"
              />
            </div>

            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="part-description"
              >
                Description
              </Label>
              <Input
                id="part-description"
                value={form.description || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, description: e.target.value }))
                }
                className="h-11"
                placeholder="Optional description"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="h-11 px-6"
          >
            {commonT("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={createPartMutation.isPending}
          className="h-11 px-6 min-w-[140px]"
        >
          {createPartMutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Create Part"
          )}
        </Button>
      </div>
    </form>
  );
}
