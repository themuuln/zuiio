"use client";

import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import PartPhotoUpload from "./part-photo-upload";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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

// ── Schema ───────────────────────────────────────────────────

const partSchema = z.object({
  name_mn: z.string().min(1, "Монгол нэр шаардлагатай"),
  name: z.string().optional(),
  part_number: z.string().optional(),
  default_price: z.string().optional(),
  purchase_price: z.string().optional(),
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
  const t = useTranslations("inventory");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null,
  );

  const createPartMutation = useCreatePart(orgId);
  const updatePartMutation = useUpdatePart(orgId);
  const { data: categories } = usePartCategories(orgId);
  const createCategory = useCreatePartCategory(orgId);
  const isUpdate = !!partId;
  const mutation = isUpdate ? updatePartMutation : createPartMutation;
  const categoryCreatRef = useRef(false);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name_mn: initialData?.name_mn ?? "",
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
      category: initialData?.category ?? "",
      unit: initialData?.unit ?? "piece",
      description: initialData?.description ?? "",
    },
  });

  const allCategories = categories ?? [];
  const selectedCategory =
    allCategories.find((c) => c.name === form.watch("category")) ?? null;

  // Check if the typed input matches an existing category name
  const inputMatchesCategory = categoryInput
    ? allCategories.some(
        (c) => c.name.toLowerCase() === categoryInput.toLowerCase(),
      )
    : false;

  const handleCreateCategory = async () => {
    const rawName = categoryInput.trim();
    if (!rawName || inputMatchesCategory) return;
    categoryCreatRef.current = true;
    try {
      const created = await createCategory.mutateAsync(rawName);
      form.setValue("category", created.name);
      setCategoryInput("");
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
        image_url: imageUrl,
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
      setError((err as Error).message || commonT("unexpectedError"));
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
                onImageChange={setImageUrl}
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
                autoFocus
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
              <Input placeholder="e.g. Oil Filter" {...form.register("name")} />
            </FieldContent>
          </Field>
        </div>

        {/* ── Part Number + Category (full) or Part Number + Price (quick) ── */}
        {currentMode === "full" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Part Number</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. OF-101"
                  {...form.register("part_number")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <Combobox
                  items={allCategories}
                  value={selectedCategory}
                  onValueChange={(cat) => {
                    if (cat) {
                      form.setValue("category", cat.name);
                    } else {
                      form.setValue("category", "");
                    }
                  }}
                  onInputValueChange={(val) => setCategoryInput(val)}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                  itemToStringLabel={(cat) => cat?.name ?? ""}
                >
                  <ComboboxInput
                    placeholder="e.g. Filters, Suspension"
                    showTrigger
                    showClear={!!form.watch("category")}
                    className="h-11"
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {(cat: { id: string; name: string }) => (
                        <ComboboxItem key={cat.id} value={cat}>
                          <span>{cat.name}</span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                    {categoryInput.trim() && !inputMatchesCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCreateCategory();
                        }}
                        disabled={createCategory.isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent cursor-pointer border-t border-border"
                      >
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                        <span>
                          {t("inventory.createCategory", {
                            name: categoryInput.trim(),
                          })}
                        </span>
                        {createCategory.isPending && (
                          <Loader2 className="size-3 animate-spin ml-auto" />
                        )}
                      </button>
                    )}
                    <ComboboxEmpty />
                  </ComboboxContent>
                </Combobox>
              </FieldContent>
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Part Number</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. OF-101"
                  {...form.register("part_number")}
                />
              </FieldContent>
            </Field>

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
          </div>
        )}

        {/* ── Full Details extra fields ── */}
        {currentMode === "full" && (
          <>
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
          </>
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
