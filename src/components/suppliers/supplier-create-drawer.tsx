"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Buildings, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSupplier } from "@/app/(dashboard)/suppliers/actions";
import { buttonVariants } from "@/components/ui/button";
import { DrawerFooter, DrawerCancel, DrawerSubmit } from "@/components/ui/drawer-footer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { contactKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { ErrorBanner } from "@/components/ui/error-banner";

const supplierSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

type SupplierValues = z.infer<typeof supplierSchema>;

export function SupplierCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  const contactMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createSupplier(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: contactKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      phone: formData.get("phone")?.toString() || null,
      email: formData.get("email")?.toString() || null,
      address: formData.get("address")?.toString() || null,
      type: "supplier" as const,
      balance: 0,
      created_at: new Date().toISOString(),
      organization_id: "",
    }),
  });

  const onSubmit = (data: SupplierValues) => {
    const formData = new FormData();
    formData.append("type", "supplier");
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.address) formData.append("address", data.address);
    contactMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Нийлүүлэгч амжилттай бүртгэгдлээ.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      title="Нийлүүлэгч бүртгэх"
      description="Шинэ нийлүүлэгчийн мэдээллийг бүртгэх."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Нийлүүлэгч бүртгэх
        </button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit form="supplier-form" isPending={isSubmitting || contactMutation.isPending} />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="supplier-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <div className="relative">
              <Buildings className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Болд ХХК"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel>Утас</FieldLabel>
            <Input
              type="tel"
              placeholder="+976 9911-2233"
              {...register("phone")}
            />
          </Field>
          <Field>
            <FieldLabel>Имэйл</FieldLabel>
            <Input
              type="email"
              placeholder="info@boldcompany.mn"
              {...register("email")}
            />
          </Field>
          <Field>
            <FieldLabel>Хаяг</FieldLabel>
            <Input
              placeholder="СБД, 1-р хороо, 2-р байр"
              {...register("address")}
            />
          </Field>
        </FieldGroup>

        <ErrorBanner error={contactMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
