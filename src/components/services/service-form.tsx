"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreateService } from "@/lib/queries/use-wizard-data";
import { Typography } from "@/components/ui/typography";
import type { ServiceCatalog, CreateServiceCatalogParams } from "@/lib/types";

export type ServiceFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateServiceCatalogParams>;
  onSuccess?: (service: ServiceCatalog) => void;
  onCancel?: () => void;
};

const initialForm: CreateServiceCatalogParams = {
  name: "",
  description: "",
  default_price: 0,
  category: "",
};

export function ServiceForm({
  mode = "full",
  initialData,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("services");
  const commonT = useTranslations("common");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [form, setForm] = useState<CreateServiceCatalogParams>({
    ...initialForm,
    ...initialData,
  });

  const [priceInput, setPriceInput] = useState(
    initialData?.default_price !== undefined
      ? String(initialData.default_price)
      : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createServiceMutation = useCreateService(orgId);

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
      errors.name = "Service name is required";
    }

    const price = parseFloat(priceInput);
    if (!priceInput.trim()) {
      errors.default_price = "Price is required";
    } else if (isNaN(price) || price < 0) {
      errors.default_price = "Enter a valid price";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);

    try {
      const payload: CreateServiceCatalogParams = {
        name: form.name.trim(),
        default_price: price,
        description:
          currentMode === "full"
            ? form.description?.trim() || undefined
            : undefined,
        category:
          currentMode === "full"
            ? form.category?.trim() || undefined
            : undefined,
      };

      const service = await createServiceMutation.mutateAsync(payload);
      onSuccess?.(service);
    } catch (err: any) {
      setError(err.message || "Failed to save service");
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
              htmlFor="service-name"
            >
              Service Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              className={`h-11 ${fieldErrors.name ? "border-destructive" : ""}`}
              placeholder="e.g. Oil Change"
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
              htmlFor="service-price"
            >
              Default Price (₮) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="service-price"
              type="number"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className={`h-11 ${fieldErrors.default_price ? "border-destructive" : ""}`}
              placeholder="45000"
            />
            {fieldErrors.default_price && (
              <Typography.Text className="text-xs text-destructive mt-1">
                {fieldErrors.default_price}
              </Typography.Text>
            )}
          </div>
        </div>

        {currentMode === "full" && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="service-category"
              >
                Category
              </Label>
              <Input
                id="service-category"
                value={form.category || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, category: e.target.value }))
                }
                className="h-11"
                placeholder="e.g. Engine, Brakes"
              />
            </div>
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="service-description"
              >
                Description
              </Label>
              <Input
                id="service-description"
                value={form.description || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, description: e.target.value }))
                }
                className="h-11"
                placeholder="e.g. Replaced engine oil and oil filter"
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
          disabled={createServiceMutation.isPending}
          className="h-11 px-6 min-w-[140px]"
        >
          {createServiceMutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Create Service"
          )}
        </Button>
      </div>
    </form>
  );
}
