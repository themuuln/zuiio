"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/ui/combobox";
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
import {
  useCreatePartCategory,
  usePartCategories,
  useUpdatePart,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreatePart } from "@/lib/queries/use-wizard-data";
import type { CreatePartParams, PartsCatalogItem } from "@/lib/types";
import { partSchema as sharedPartSchema } from "@/lib/validation/part-schema";
import PartPhotoUpload from "./part-photo-upload";

// ── Schema ───────────────────────────────────────────────────
// Import shared part schema validators but use snake_case field names
// matching form field names (name_mn, part_number, default_price, purchase_price).

const partSchema = z.object({
  name_mn: sharedPartSchema.shape.nameMn,
  name: sharedPartSchema.shape.name,
  part_number: sharedPartSchema.shape.partNumber,
  barcode: sharedPartSchema.shape.barcode,
  default_price: sharedPartSchema.shape.defaultPrice,
  purchase_price: sharedPartSchema.shape.purchasePrice,
  category: sharedPartSchema.shape.category,
  unit: sharedPartSchema.shape.unit,
  description: sharedPartSchema.shape.description,
  location: sharedPartSchema.shape.location,
});

type PartFormValues = z.infer<typeof partSchema>;

// ── Component ────────────────────────────────────────────────

export type PartFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreatePartParams>;
  partId?: string; // when present, switches to update mode
  readOnly?: boolean; // display-only mode, no submit button
  hideActions?: boolean; // when true, don't render inline buttons (for drawer footer usage)
  formId?: string; // set form id so external submit buttons can connect via form="id"
  onSuccess?: (part: PartsCatalogItem) => void;
  onCancel?: () => void;
};

export function PartForm({
  mode = "full",
  initialData,
  partId,
  readOnly = false,
  hideActions = false,
  formId,
  onSuccess,
  onCancel,
}: PartFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const commonT = useTranslations("common");
  const t = useTranslations("inventory");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null,
  );
  const [imageDirty, setImageDirty] = useState(false);
  const handleImageChange = (url: string | null) => {
    setImageUrl(url);
    setImageDirty(true);
  };

  const createPartMutation = useCreatePart(orgId);
  const updatePartMutation = useUpdatePart(orgId);
  const { data: categories } = usePartCategories(orgId);
  const createCategory = useCreatePartCategory(orgId);
  const isUpdate = !!partId;
  const mutation = isUpdate ? updatePartMutation : createPartMutation;

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name_mn: initialData?.name_mn ?? "",
      name: initialData?.name ?? "",
      part_number: initialData?.part_number ?? "",
      barcode: initialData?.barcode ?? "",
      default_price:
        initialData?.default_price != null
          ? String(initialData.default_price)
          : "",
      purchase_price:
        initialData?.purchase_price != null
          ? String(initialData.purchase_price)
          : "",
      category: initialData?.category ?? "",
      unit: initialData?.unit ?? "piece",
      description: initialData?.description ?? "",
      location: initialData?.location ?? "",
    },
  });

  const allCategories = categories ?? [];
  const selectedCategory =
    allCategories.find((c) => c.name === form.watch("category")) ?? null;

  const handleCreateCategory = async (name: string) => {
    if (!name) return;
    try {
      const created = (await createCategory.mutateAsync(name)) as {
        name: string;
      };
      form.setValue("category", created.name);
    } catch {
      // toast is handled by mutation
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      setError(commonT("noOrganization"));
      return;
    }
    setError(null);

    try {
      const nameEn = data.name?.trim();
      const nameMn = data.name_mn.trim();

      const payload: CreatePartParams = {
        name: nameEn || nameMn,
        part_number: data.part_number?.trim() || undefined,
        barcode: data.barcode?.trim() || undefined,
        default_price: data.default_price?.trim()
          ? Number(data.default_price)
          : undefined,
        name_mn: nameMn,
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
        location:
          currentMode === "full"
            ? data.location?.trim() || undefined
            : undefined,
        image_url: imageDirty ? imageUrl : undefined,
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
        form.reset();
        setImageUrl(null);
        setImageDirty(false);
      }
      onSuccess?.(part);
    } catch (err: unknown) {
      setError((err as Error).message || commonT("unexpectedError"));
    }
  });

  return (
    <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* ── Mode Toggle Tabs (hidden in readOnly) ── */}
      {!readOnly && (
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
              {t("quickAdd")}
            </TabsTrigger>
            <TabsTrigger
              value="full"
              className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
            >
              {t("fullDetails")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <FieldGroup>
        {/* ── Photo Upload ── */}
        {currentMode === "full" && (
          <Field>
            <FieldLabel>
              Зураг
              <span className="text-xs text-muted-foreground ml-1">
                (optional)
              </span>
            </FieldLabel>
            <FieldContent>
              <PartPhotoUpload
                orgId={orgId}
                partId={partId}
                imageUrl={imageUrl}
                onImageChange={handleImageChange}
                readOnly={readOnly}
              />
            </FieldContent>
          </Field>
        )}

        {/* ── Names — Mongolian first ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.name_mn}>
            <FieldLabel>
              Монгол нэр <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder="Тосны шүүлтүүр"
                autoFocus={!readOnly}
                disabled={readOnly}
                aria-invalid={!!form.formState.errors.name_mn}
                {...form.register("name_mn")}
              />
              {form.formState.errors.name_mn && (
                <FieldError>{form.formState.errors.name_mn.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              English Name{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder="e.g. Oil Filter"
                disabled={readOnly}
                {...form.register("name")}
              />
            </FieldContent>
          </Field>
        </div>

        {/* ── Part Number + Category (full) or Part Number + Price (quick) ── */}
        {currentMode === "full" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Part Number</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="e.g. OF-101"
                    disabled={readOnly}
                    {...form.register("part_number")}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Category</FieldLabel>
                <FieldContent>
                  <CreatableCombobox
                    items={allCategories}
                    value={selectedCategory}
                    onValueChange={(cat) => {
                      if (cat) {
                        form.setValue("category", cat.name);
                      } else {
                        form.setValue("category", "");
                      }
                    }}
                    onCreateItem={handleCreateCategory}
                    itemToStringLabel={(item) => item?.name ?? ""}
                    isItemEqualToValue={(a, b) => a?.name === b?.name}
                    placeholder="Select category"
                    disabled={readOnly}
                    className="h-11"
                  />
                </FieldContent>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Barcode</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Scan or enter barcode"
                    disabled={readOnly}
                    {...form.register("barcode")}
                  />
                </FieldContent>
              </Field>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Part Number</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. OF-101"
                  disabled={readOnly}
                  {...form.register("part_number")}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.default_price}>
              <FieldLabel>Default Selling Price (₮)</FieldLabel>
              <FieldContent>
                <CurrencyInput
                  min={0}
                  placeholder="15000"
                  disabled={readOnly}
                  value={
                    form.watch("default_price")?.trim()
                      ? Number(form.watch("default_price"))
                      : undefined
                  }
                  onChange={(val) =>
                    form.setValue("default_price", String(val))
                  }
                />
                {form.formState.errors.default_price && (
                  <FieldError>
                    {form.formState.errors.default_price.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
          </div>
        )}

        {/* ── Full Details extra fields ── */}
        {currentMode === "full" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.default_price}>
              <FieldLabel>Default Selling Price (₮)</FieldLabel>
              <FieldContent>
                <CurrencyInput
                  min={0}
                  placeholder="15000"
                  value={
                    form.watch("default_price")?.trim()
                      ? Number(form.watch("default_price"))
                      : undefined
                  }
                  onChange={(val) =>
                    form.setValue("default_price", String(val))
                  }
                />
                {form.formState.errors.default_price && (
                  <FieldError>
                    {form.formState.errors.default_price.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.purchase_price}>
              <FieldLabel>Purchase Price (₮)</FieldLabel>
              <FieldContent>
                <CurrencyInput
                  min={0}
                  placeholder="10000"
                  value={
                    form.watch("purchase_price")?.trim()
                      ? Number(form.watch("purchase_price"))
                      : undefined
                  }
                  onChange={(val) =>
                    form.setValue("purchase_price", String(val))
                  }
                />
                {form.formState.errors.purchase_price && (
                  <FieldError>
                    {form.formState.errors.purchase_price.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Unit</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. piece, liter"
                  disabled={readOnly}
                  {...form.register("unit")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Optional description"
                  disabled={readOnly}
                  {...form.register("description")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Тавиурын байршил</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. A-3-12"
                  disabled={readOnly}
                  {...form.register("location")}
                />
              </FieldContent>
            </Field>
          </div>
        )}
      </FieldGroup>

      {/* Action buttons (hidden in readOnly mode) */}
      {!readOnly && !hideActions && (
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
                {commonT("saving")}
              </span>
            ) : isUpdate ? (
              t("updatePart")
            ) : (
              t("createPart")
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
