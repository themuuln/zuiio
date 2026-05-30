"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { useUpdatePart } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreatePart } from "@/lib/queries/use-wizard-data";
import type { CreatePartParams, PartsCatalogItem } from "@/lib/types";

// ── Schema ───────────────────────────────────────────────────
// Number fields are strings in the form (matching <Input type="number">).
// Validated via refine, converted to number in the submit handler.

const partSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  part_number: z.string().optional(),
  default_price: z.string().optional(),
  purchase_price: z.string().optional(),
  name_mn: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
});

type PartFormValues = z.infer<typeof partSchema>;

// ── Component ────────────────────────────────────────────────

export type PartFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreatePartParams>;
  partId?: string; // when present, switches to update mode
  onSuccess?: (part: PartsCatalogItem) => void;
  onCancel?: () => void;
};

export function PartForm({
  mode = "full",
  initialData,
  partId,
  onSuccess,
  onCancel,
}: PartFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const commonT = useTranslations("common");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);

  const createPartMutation = useCreatePart(orgId);
  const updatePartMutation = useUpdatePart(orgId);
  const isUpdate = !!partId;
  const mutation = isUpdate ? updatePartMutation : createPartMutation;

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      part_number: initialData?.part_number ?? "",
      default_price:
        initialData?.default_price != null
          ? String(initialData.default_price)
          : "",
      purchase_price:
        initialData?.purchase_price != null
          ? String(initialData.purchase_price)
          : "",
      name_mn: initialData?.name_mn ?? "",
      category: initialData?.category ?? "",
      unit: initialData?.unit ?? "piece",
      description: initialData?.description ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);

    try {
      const payload: CreatePartParams = {
        name: data.name.trim(),
        part_number: data.part_number?.trim() || undefined,
        default_price: data.default_price?.trim()
          ? Number(data.default_price)
          : undefined,
        name_mn:
          currentMode === "full"
            ? data.name_mn?.trim() || undefined
            : undefined,
        category:
          currentMode === "full"
            ? data.category?.trim() || undefined
            : undefined,
        description:
          currentMode === "full"
            ? data.description?.trim() || undefined
            : undefined,
        unit: currentMode === "full" ? data.unit?.trim() || "piece" : "piece",
        purchase_price:
          currentMode === "full" && data.purchase_price?.trim()
            ? Number(data.purchase_price)
            : undefined,
        global_part_id: initialData?.global_part_id ?? undefined,
      };

      let part: PartsCatalogItem;
      if (isUpdate && partId) {
        part = await updatePartMutation.mutateAsync({
          id: partId,
          body: payload,
        });
      } else {
        part = await createPartMutation.mutateAsync(payload);
      }
      onSuccess?.(part);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save part");
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

      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel>
              Part Name <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder="e.g. Oil Filter"
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
            <FieldLabel>Part Number</FieldLabel>
            <FieldContent>
              <Input
                placeholder="e.g. OF-101"
                {...form.register("part_number")}
              />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.default_price}>
            <FieldLabel>Default Selling Price (₮)</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                min="0"
                placeholder="15000"
                aria-invalid={!!form.formState.errors.default_price}
                {...form.register("default_price")}
              />
              {form.formState.errors.default_price && (
                <FieldError>
                  {form.formState.errors.default_price.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {currentMode === "full" && (
            <Field data-invalid={!!form.formState.errors.purchase_price}>
              <FieldLabel>Purchase Price (₮)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min="0"
                  placeholder="10000"
                  aria-invalid={!!form.formState.errors.purchase_price}
                  {...form.register("purchase_price")}
                />
                {form.formState.errors.purchase_price && (
                  <FieldError>
                    {form.formState.errors.purchase_price.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
          )}
        </div>

        {currentMode === "full" && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            <Field>
              <FieldLabel>Mongolian Name (Монгол нэр)</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Тосны шүүлтүүр"
                  {...form.register("name_mn")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. Filters, Suspension"
                  {...form.register("category")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Unit</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. piece, liter"
                  {...form.register("unit")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Optional description"
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
          disabled={mutation.isPending}
          className="h-11 px-6 min-w-[140px]"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : isUpdate ? (
            "Update Part"
          ) : (
            "Create Part"
          )}
        </Button>
      </div>
    </form>
  );
}
