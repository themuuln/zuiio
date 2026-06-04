"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DetailSheet } from "@/components/ui/detail-sheet";
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
      toast.error("Failed to update service");
    },
    onSuccess: () => {
      toast.success("Service updated");
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
    <DetailSheet open={open} onOpenChange={handleOpenChange} size="lg">
      <DetailSheet.Header>
        <DetailSheet.Title>
          {t("editService") || "Edit Service"}
        </DetailSheet.Title>
        <DetailSheet.Description>
          {t("editServiceDescription") || "Update service details and pricing"}
        </DetailSheet.Description>
      </DetailSheet.Header>

      <DetailSheet.Body>
        <FieldGroup>
          {/* Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {t("name")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. Oil Change"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>{t("nameMn") || "Монгол нэр"}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. Тос солих"
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
                  placeholder="e.g. Oil, Brakes"
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
                        c.toLowerCase() === categoryInput.trim().toLowerCase(),
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
                        <span>Create &ldquo;{categoryInput.trim()}&rdquo;</span>
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
                placeholder="e.g. Replaced engine oil and oil filter"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
      </DetailSheet.Body>

      <DetailSheet.Footer>
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          {commonT("cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || !name.trim()}
        >
          {updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            commonT("save") || "Save"
          )}
        </Button>
      </DetailSheet.Footer>
    </DetailSheet>
  );
}
