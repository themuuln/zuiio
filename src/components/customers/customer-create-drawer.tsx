"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, User } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createContact } from "@/app/(dashboard)/customers/actions";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { contactKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const customerSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

type CustomerValues = z.infer<typeof customerSchema>;

export function CustomerCreateDrawer({
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
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  const contactMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createContact(undefined, formData);
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
      type: "customer",
      balance: 0,
      created_at: new Date().toISOString(),
      organization_id: "",
    }),
  });

  const onSubmit = (data: CustomerValues) => {
    const formData = new FormData();
    formData.append("type", "customer");
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.address) formData.append("address", data.address);
    contactMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Харилцагч амжилттай бүртгэгдлээ.");
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
      title="Харилцагч бүртгэх"
      description="Шинэ харилцагчийн мэдээллийг бүртгэх."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Харилцагч бүртгэх
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Болд Цэцгээ"
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
              placeholder="bold@example.com"
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

        {contactMutation.error ? (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {contactMutation.error.message}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonVariants({ variant: "outline" })}
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={isSubmitting || contactMutation.isPending}
            className={buttonVariants({ variant: "default" })}
          >
            {contactMutation.isPending ? "Хадгалах..." : "Хадгалах"}
          </button>
        </div>
      </form>
    </SlideInDrawer>
  );
}
