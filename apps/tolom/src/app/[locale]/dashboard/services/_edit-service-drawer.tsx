"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dices, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { VariantEditorSheet } from "@/components/services/variant-editor-drawer";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { serviceKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ServiceCatalog } from "@/lib/types";

// ── Schema ─────────────────────────────────────────────────────

const editServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  nameMn: z.string().optional(),
  defaultPrice: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(parseFloat(val)), "Enter a valid price"),
  category: z.string().optional(),
  description: z.string().optional(),
});

type EditServiceValues = z.infer<typeof editServiceSchema>;

// ── Props ──────────────────────────────────────────────────────

interface EditServiceSheetProps {
  service: ServiceCatalog | null;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceSheet({
  service,
  categories,
  open,
  onOpenChange,
}: EditServiceSheetProps) {
  const t = useTranslations("services");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const queryClient = useQueryClient();

  const [categoryInput, setCategoryInput] = useState("");
  const [showVariants, setShowVariants] = useState(false);

  const form = useForm<EditServiceValues>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      name: "",
      nameMn: "",
      defaultPrice: "",
      category: "",
      description: "",
    },
  });

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        nameMn: service.name_mn ?? "",
        defaultPrice: String(service.default_price),
        category: service.category ?? "",
        description: service.description ?? "",
      });
      setCategoryInput("");
    }
  }, [service, form]);

  const watchedCategory = form.watch("category");

  const updateMutation = useMutation({
    mutationFn: async (data: EditServiceValues) => {
      if (!orgId || !service) return;
      const r = await fetch(
        `/api/organizations/${orgId}/services/${service.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name.trim(),
            name_mn: data.nameMn?.trim() || null,
            default_price: parseFloat(data.defaultPrice) || 0,
            category: data.category?.trim() || null,
            description: data.description?.trim() || null,
          }),
        },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as ServiceCatalog;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<ServiceCatalog[]>(
        serviceKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<ServiceCatalog[]>(
        serviceKeys.list(orgId ?? ""),
        (old) =>
          (old ?? []).map((s) =>
            s.id === service?.id
              ? {
                  ...s,
                  name: data.name.trim(),
                  name_mn: data.nameMn?.trim() || null,
                  default_price: parseFloat(data.defaultPrice) || 0,
                  category: data.category?.trim() || null,
                  description: data.description?.trim() || null,
                }
              : s,
          ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          serviceKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toast.error(t("failedToUpdate"));
    },
    onSuccess: () => {
      toast.success(t("serviceUpdated"));
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
    },
  });

  const handleSave = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) setCategoryInput("");
    onOpenChange(open);
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={handleOpenChange}
        size="lg"
        modal={false}
      >
        <DetailDrawer.Header
          actions={
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setShowVariants(true)}
            >
              <Dices className="size-4" />
              {t("manageVariants")}
            </Button>
          }
        >
          <DetailDrawer.Title>{t("editService")}</DetailDrawer.Title>
          <DetailDrawer.Description>
            {t("editServiceDescription")}
          </DetailDrawer.Description>
        </DetailDrawer.Header>

        <DetailDrawer.Body>
          <FieldGroup>
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel>
                  {t("serviceName")} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("namePlaceholderEn")}
                    aria-invalid={!!form.formState.errors.name}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <FieldError>
                      {form.formState.errors.name.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{t("nameMn")}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("namePlaceholderMn")}
                    {...form.register("nameMn")}
                  />
                </FieldContent>
              </Field>
            </div>

            {/* Default Price */}
            <Field data-invalid={!!form.formState.errors.defaultPrice}>
              <FieldLabel>
                {t("price")} (₮) <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <CurrencyInput
                  value={Number(form.watch("defaultPrice")) || 0}
                  onChange={(val) => form.setValue("defaultPrice", String(val))}
                  min={0}
                  placeholder="45000"
                  aria-invalid={!!form.formState.errors.defaultPrice}
                />
                {form.formState.errors.defaultPrice && (
                  <FieldError>
                    {form.formState.errors.defaultPrice.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Category Combobox */}
            <Field>
              <FieldLabel>{t("category")}</FieldLabel>
              <FieldContent>
                <Combobox
                  items={categories.map((c) => ({ name: c }))}
                  value={watchedCategory ? { name: watchedCategory } : null}
                  onValueChange={(item) => {
                    form.setValue("category", item?.name ?? "");
                    setCategoryInput("");
                  }}
                  onInputValueChange={(val) => setCategoryInput(val)}
                  isItemEqualToValue={(a, b) => a.name === b.name}
                  itemToStringLabel={(item) => item?.name ?? ""}
                >
                  <ComboboxInput
                    placeholder={t("categoryPlaceholder")}
                    showTrigger
                    showClear={!!watchedCategory}
                    className="h-10"
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {(item: { name: string }) => (
                        <ComboboxItem key={item.name} value={item}>
                          <span>{item.name}</span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                    {categoryInput.trim() &&
                      !categories.some(
                        (c) =>
                          c.toLowerCase() ===
                          categoryInput.trim().toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            form.setValue("category", categoryInput.trim());
                            setCategoryInput("");
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent cursor-pointer border-t border-border"
                        >
                          <span>
                            {t("createCategory", {
                              name: categoryInput.trim(),
                            })}
                          </span>
                        </button>
                      )}
                    <ComboboxEmpty />
                  </ComboboxContent>
                </Combobox>
              </FieldContent>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>{t("description")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("descriptionPlaceholder")}
                  {...form.register("description")}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </DetailDrawer.Body>

        <DetailDrawer.Footer>
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : (
                commonT("save")
              )}
            </Button>
          </div>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* Variant Editor */}
      <VariantEditorSheet
        entityType="service"
        entityId={service?.id ?? null}
        entityName={service?.name ?? ""}
        defaultPrice={service?.default_price ?? 0}
        open={showVariants}
        onOpenChange={setShowVariants}
      />
    </>
  );
}
