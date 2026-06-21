"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NotePencil, User } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateContact } from "@/app/(dashboard)/customers/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { contactKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

export interface CustomerEditData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const customerEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
});

type CustomerEditValues = z.infer<typeof customerEditSchema>;

export function CustomerEditDrawer({
  customer,
  children,
}: {
  customer: CustomerEditData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerEditValues>({
    resolver: zodResolver(customerEditSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    },
  });

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateContact(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: contactKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
      phone: formData.get("phone")?.toString() || null,
      email: formData.get("email")?.toString() || null,
      address: formData.get("address")?.toString() || null,
    }),
  });

  const onSubmit = (data: CustomerEditValues) => {
    const formData = new FormData();
    formData.append("id", customer.id);
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("email", data.email);
    formData.append("address", data.address);
    editMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Харилцагч амжилттай шинэчлэгдлээ.");
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
    >
      <DrawerHeader title="Харилцагч засах" description={customer.name} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 overflow-y-auto space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-name"
                  className="pl-9"
                  placeholder="Болд Цэцгээ"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-phone">Утас</FieldLabel>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+976 9911-2233"
                {...register("phone")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-email">Имэйл</FieldLabel>
              <Input
                id="edit-email"
                type="email"
                placeholder="bold@example.com"
                {...register("email")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-address">Хаяг</FieldLabel>
              <Input
                id="edit-address"
                placeholder="СБД, 1-р хороо, 2-р байр"
                {...register("address")}
              />
            </Field>
          </FieldGroup>
        </div>

        <ErrorBanner error={editMutation.error} />

        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit isPending={editMutation.isPending} label="Хадгалах" />
        </DrawerFooter>
      </form>
    </DrawerLayout>
  );
}
