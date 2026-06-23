"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Folder, NotePencil } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateCategory } from "@/app/(dashboard)/inventory/categories/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { categoryKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

export interface CategoryEditData {
  id: string;
  name: string;
}

const categoryEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
});

type CategoryEditValues = z.infer<typeof categoryEditSchema>;

export function CategoryEditDrawer({
  category,
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  category: CategoryEditData;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryEditValues>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: {
      name: category.name,
    },
  });

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateCategory(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: categoryKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
    }),
  });

  const onSubmit = (data: CategoryEditValues) => {
    const formData = new FormData();
    formData.append("id", category.id);
    formData.append("name", data.name);
    editMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Ангилал амжилттай шинэчлэгдлээ.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        children ?? (
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <NotePencil className="size-3.5" />
          </button>
        )
      }
      title="Ангилал засах"
      description={category.name}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            isPending={editMutation.isPending}
            label="Хадгалах"
            form="edit-category-form"
          />
        </DrawerFooter>
      }
    >
      <form id="edit-category-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
              <div className="relative">
                <Folder className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-name"
                  className="pl-9"
                  placeholder="Хоол, ундаа"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </Field>
          </FieldGroup>
        </div>

        <ErrorBanner error={editMutation.error} />
      </form>
    </DrawerLayout>
  );
}
