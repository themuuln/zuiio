"use client";

import { useOrgMutation } from "@zuiio/query";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@/lib/hooks/use-form";
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
  defaultCost: z.string().optional(),
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

  const [categoryInput, setCategoryInput] = useState("");
  const [showVariants, setShowVariants] = useState(false);

  const form = useForm<EditServiceValues>({
    defaultValues: {
      name: "",
      nameMn: "",
      defaultPrice: "",
      defaultCost: "",
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
        defaultCost:
          service.default_cost != null ? String(service.default_cost) : "",
        category: service.category ?? "",
        description: service.description ?? "",
      });
      setCategoryInput("");
    }
  }, [service, form]);

  const watchedCategory = form.watch("category");

  const updateMutation = useOrgMutation<
    ServiceCatalog,
    { serviceId: string; data: EditServiceValues }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/services/${vars.serviceId}`,
    method: "PATCH",
    queryKey: serviceKeys.all(orgId ?? ""),
    bodyFn: (vars) => vars.data,
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(t("failedToUpdate"), {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  const handleSave = form.handleSubmit((data) => {
    if (!service) return;
    updateMutation.mutate({ serviceId: service.id, data });
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) setCategoryInput("");
    onOpenChange(open);
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      modal={false}
      nestedContent={
        <VariantEditorSheet
          entityType="service"
          entityId={service?.id ?? null}
          entityName={service?.name ?? ""}
          defaultPrice={service?.default_price ?? 0}
          open={showVariants}
          onOpenChange={setShowVariants}
        />
      }
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
                  <FieldError>{form.formState.errors.name.message}</FieldError>
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
          {/* Default Cost */}
          <Field>
            <FieldLabel>{t("cost")} (₮)</FieldLabel>
            <FieldContent>
              <CurrencyInput
                value={Number(form.watch("defaultCost")) || 0}
                onChange={(val) => form.setValue("defaultCost", String(val))}
                min={0}
                placeholder="0"
              />
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
                        c.toLowerCase() === categoryInput.trim().toLowerCase(),
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
        <DetailDrawer.FooterActions>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            {commonT("cancel")}
          </Button>
          <Button
            size="lg"
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
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
