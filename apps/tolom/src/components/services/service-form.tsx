"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { reportServerError } from "@/lib/sentry-report-server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreateService } from "@/lib/queries/use-wizard-data";
import type { CreateServiceCatalogParams, ServiceCatalog } from "@/lib/types";
import { serviceSchema as sharedServiceSchema } from "@/lib/validation/service-schema";

// ── Schema ───────────────────────────────────────────────────
// Import shared service schema validators but use snake_case field names
// matching form field names (name_mn, default_price).

const serviceSchema = z.object({
  name: sharedServiceSchema.shape.name,
  name_mn: sharedServiceSchema.shape.nameMn,
  default_price: sharedServiceSchema.shape.defaultPrice,
  category: sharedServiceSchema.shape.category,
  description: sharedServiceSchema.shape.description,
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

// ── Component ────────────────────────────────────────────────

export type ServiceFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateServiceCatalogParams>;
  onSuccess?: (service: ServiceCatalog) => void;
  onCancel?: () => void;
};

export function ServiceForm({
  mode = "full",
  initialData,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const commonT = useTranslations("common");
  const st = useTranslations("services");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);

  const createServiceMutation = useCreateService(orgId);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      name_mn: initialData?.name_mn ?? "",
      default_price:
        initialData?.default_price != null
          ? String(initialData.default_price)
          : "",
      category: initialData?.category ?? "",
      description: initialData?.description ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);

    try {
      const payload: CreateServiceCatalogParams = {
        name: data.name.trim(),
        name_mn: data.name_mn?.trim() || undefined,
        default_price: Number(data.default_price),
        description:
          currentMode === "full"
            ? data.description?.trim() || undefined
            : undefined,
        category:
          currentMode === "full"
            ? data.category?.trim() || undefined
            : undefined,
      };

      const service = await createServiceMutation.mutateAsync(payload);
      onSuccess?.(service);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : st("failedToSave"));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            {st("quickAdd")}
          </TabsTrigger>
          <TabsTrigger
            value="full"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            {st("fullDetails")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel>
              {st("serviceName")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={st("namePlaceholderEn")}
                autoFocus
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{st("nameMn")}</FieldLabel>
            <FieldContent>
              <Input
                placeholder={st("namePlaceholderMn")}
                {...form.register("name_mn")}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.formState.errors.default_price}>
            <FieldLabel>
              {st("price")} (₮) <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <CurrencyInput
                placeholder="45000"
                value={Number(form.watch("default_price")) || 0}
                onChange={(val) => form.setValue("default_price", String(val))}
              />
              {form.formState.errors.default_price && (
                <FieldError>
                  {form.formState.errors.default_price.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>
        </div>

        {currentMode === "full" && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            <Field>
              <FieldLabel>{st("category")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={st("categoryPlaceholderForm")}
                  {...form.register("category")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{st("description")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={st("descriptionPlaceholder")}
                  {...form.register("description")}
                />
              </FieldContent>
            </Field>
          </div>
        )}
      </FieldGroup>

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
              {st("saving")}
            </span>
          ) : (
            st("createService")
          )}
        </Button>
      </div>
    </form>
  );
}
