"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dices, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { VariantEditorSheet } from "@/components/services/variant-editor-sheet";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { serviceKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ServiceCatalog } from "@/lib/types";

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

  const [name, setName] = useState("");
  const [nameMn, setNameMn] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [showVariants, setShowVariants] = useState(false);

  // Reset form when the sheet opens with a different service
  const [prevServiceId, setPrevServiceId] = useState<string | null>(null);
  if (service && service.id !== prevServiceId) {
    setPrevServiceId(service.id);
    setName(service.name);
    setNameMn(service.name_mn ?? "");
    setDefaultPrice(String(service.default_price));
    setCategory(service.category ?? "");
    setDescription(service.description ?? "");
    setCategoryInput("");
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !service) return;
      const r = await fetch(
        `/api/organizations/${orgId}/services/${service.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            name_mn: nameMn.trim() || null,
            default_price: parseFloat(defaultPrice) || 0,
            category: category || null,
            description: description.trim() || null,
          }),
        },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as ServiceCatalog;
    },
    onMutate: async () => {
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
                  name: name.trim(),
                  name_mn: nameMn.trim() || null,
                  default_price: parseFloat(defaultPrice) || 0,
                  category: category || null,
                  description: description.trim() || null,
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

  const handleSave = () => {
    if (!name.trim()) return;
    updateMutation.mutate();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setCategoryInput("");
    onOpenChange(open);
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        swipeDirection="right"
        modal={false}
      >
        <DrawerContent contentClassName="bg-background">
          <DrawerHeader className="border-b border-border px-5 py-5 pr-16">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>{t("editService")}</DrawerTitle>
                <DrawerDescription>
                  {t("editServiceDescription")}
                </DrawerDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setShowVariants(true)}
              >
                <Dices className="size-4" />
                {t("manageVariants")}
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <FieldGroup>
              {/* Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>
                    {t("serviceName")}{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={t("namePlaceholderEn")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>{t("nameMn")}</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={t("namePlaceholderMn")}
                      value={nameMn}
                      onChange={(e) => setNameMn(e.target.value)}
                    />
                  </FieldContent>
                </Field>
              </div>

              {/* Default Price */}
              <Field>
                <FieldLabel>
                  {t("price")} (₮) <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="0"
                    placeholder="45000"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                  />
                </FieldContent>
              </Field>

              {/* Category Combobox */}
              <Field>
                <FieldLabel>{t("category")}</FieldLabel>
                <FieldContent>
                  <Combobox
                    items={categories.map((c) => ({ name: c }))}
                    value={category ? { name: category } : null}
                    onValueChange={(item) => {
                      setCategory(item?.name ?? "");
                      setCategoryInput("");
                    }}
                    onInputValueChange={(val) => setCategoryInput(val)}
                    isItemEqualToValue={(a, b) => a.name === b.name}
                    itemToStringLabel={(item) => item?.name ?? ""}
                  >
                    <ComboboxInput
                      placeholder={t("categoryPlaceholder")}
                      showTrigger
                      showClear={!!category}
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
                              setCategory(categoryInput.trim());
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <DrawerFooter className="border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
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
                disabled={updateMutation.isPending || !name.trim()}
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
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
