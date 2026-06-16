"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Buildings, Plus } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupplier } from "@/app/(dashboard)/suppliers/actions";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { contactKeys } from "@/lib/query/keys";
import { toast } from "sonner";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  const contactMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createSupplier(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: contactKeys.all() });
      const snapshot = queryClient.getQueriesData({ queryKey: contactKeys.all() });

      const name = formData.get("name")?.toString() ?? "";
      const phone = formData.get("phone")?.toString() ?? "";
      const email = formData.get("email")?.toString() ?? "";
      const address = formData.get("address")?.toString() ?? "";

      const optimisticContact = {
        id: `opt-${Date.now()}`,
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        type: "supplier" as const,
        balance: 0,
        created_at: new Date().toISOString(),
        organization_id: "",
      };

      queryClient.setQueriesData(
        { queryKey: contactKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) return [optimisticContact, ...oldData];
          return oldData;
        },
      );
      return { snapshot };
    },
    onSuccess: () => {
      setOpen(false);
      setServerError(null);
      reset();
      router.refresh();
      toast.success("Нийлүүлэгч амжилттай бүртгэгдлээ.");
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      setServerError(err.message || "Нийлүүлэгч бүртгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all() });
    },
  });

  const onSubmit = (data: SupplierValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("type", "supplier");
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.address) formData.append("address", data.address);
    contactMutation.mutate(formData);
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) { setServerError(null); reset(); }
      }}
      title="Нийлүүлэгч бүртгэх"
      description="Шинэ нийлүүлэгчийн мэдээллийг бүртгэх."
      trigger={
        <button type="button" className={buttonVariants({ variant: "default" })}>
          <Plus className="size-4" />
          Нийлүүлэгч бүртгэх
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <div className="relative">
              <Buildings className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Болд ХХК" {...register("name")} />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </Field>
          <Field>
            <FieldLabel>Утас</FieldLabel>
            <Input type="tel" placeholder="+976 9911-2233" {...register("phone")} />
          </Field>
          <Field>
            <FieldLabel>Имэйл</FieldLabel>
            <Input type="email" placeholder="info@boldcompany.mn" {...register("email")} />
          </Field>
          <Field>
            <FieldLabel>Хаяг</FieldLabel>
            <Input placeholder="СБД, 1-р хороо, 2-р байр" {...register("address")} />
          </Field>
        </FieldGroup>

        {serverError && (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{serverError}</div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>Цуцлах</button>
          <button type="submit" disabled={isSubmitting || contactMutation.isPending} className={buttonVariants({ variant: "default" })}>
            {contactMutation.isPending ? "Хадгалах..." : "Хадгалах"}
          </button>
        </div>
      </form>
    </SlideInDrawer>
  );
}
