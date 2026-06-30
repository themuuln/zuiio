"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Folder, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createCategory } from "@/app/(dashboard)/inventory/categories/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { categoryKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const allPresetCategories = [
  ...new Set(Object.values(PRESET_CATEGORIES).flat()),
];

const categorySchema = z.object({
  name: z.string().min(1, "Ангиллын нэр шаардлагатай"),
});

type CategoryValues = z.infer<typeof categorySchema>;

export function CategoryCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [categoryQuery, setCategoryQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([
    ...allPresetCategories,
  ]);

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const trimmedQuery = categoryQuery.trim().toLowerCase();
  const categoryItems = useMemo(
    () =>
      trimmedQuery
        ? allCategories.filter((c) => c.toLowerCase().includes(trimmedQuery))
        : allCategories,
    [allCategories, trimmedQuery],
  );

  const categoryMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createCategory(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return result;
    },
    queryKey: categoryKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      product_count: 0,
    }),
  });

  const onSubmit = (data: CategoryValues) => {
    if (categoryMutation.isPending) return;
    const formData = new FormData();
    formData.append("name", data.name);
    categoryMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setSelectedCategory(null);
        setCategoryQuery("");
        reset();
        toast.success("Ангилал амжилттай үүсгэгдлээ.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelectedCategory(null);
          setCategoryQuery("");
          reset();
        }
      }}
      title="Ангилал нэмэх"
      description="Бүтээгдэхүүний шинэ ангилал үүсгэх."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Ангилал нэмэх
        </button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="category-form"
            isPending={isSubmitting || categoryMutation.isPending}
            data-testid="create-category-submit"
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="category-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <div className="relative">
              <Folder className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Combobox
                items={categoryItems}
                value={selectedCategory}
                onValueChange={(next: string | null) => {
                  if (next && !allCategories.includes(next)) {
                    setAllCategories((prev) => [...prev, next]);
                  }
                  setSelectedCategory(next);
                  setCategoryQuery("");
                  setValue("name", next ?? "", { shouldValidate: true });
                }}
                itemToStringValue={(item: string | null) => item ?? ""}
                itemToStringLabel={(item: string | null) => item ?? ""}
                inputValue={categoryQuery}
                onInputValueChange={setCategoryQuery}
              >
                <ComboboxInput
                  placeholder="Хоол, ундаа"
                  className="pl-9 w-full"
                />
                <ComboboxContent>
                  <ComboboxCreate />
                  <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item}>{item}</ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>
        </FieldGroup>

        <ErrorBanner error={categoryMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
