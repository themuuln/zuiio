"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NotePencil } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateWarehouse } from "@/app/(dashboard)/inventory/warehouses/actions";
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

const warehouseSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  location: z.string().optional(),
});

type WarehouseValues = z.infer<typeof warehouseSchema>;

export interface WarehouseEditData {
  id: string;
  name: string;
  location: string | null;
}

export function WarehouseEditDrawer({
  warehouse,
}: {
  warehouse: WarehouseEditData;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse.name,
      location: warehouse.location ?? "",
    },
  });

  const onSubmit = async (data: WarehouseValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("id", warehouse.id);
    formData.append("name", data.name);
    formData.append("location", data.location ?? "");

    const result = await updateWarehouse(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      toast.success("Агуулах амжилттай шинэчлэгдсэн.");
    }
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Засах"
        >
          <NotePencil className="size-3.5" />
        </button>
      }
      title="Агуулах засах"
      description={warehouse.name}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="edit-warehouse-form"
            isPending={isSubmitting}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
          />
        </DrawerFooter>
      }
    >
      <form id="edit-warehouse-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
              <Input id="edit-name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-location">
                Байршил{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                id="edit-location"
                placeholder="1-р давхар, А хэсэг"
                {...register("location")}
              />
            </Field>
          </FieldGroup>
        </div>

        <ErrorBanner error={serverError} />
      </form>
    </DrawerLayout>
  );
}
