"use client";

import { Drawer } from "@base-ui/react/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Buildings, NotePencil, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateSupplier } from "@/app/(dashboard)/suppliers/actions";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface SupplierEditData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const supplierEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
});

type SupplierEditValues = z.infer<typeof supplierEditSchema>;

export function SupplierEditDrawer({
  supplier,
  children,
}: {
  supplier: SupplierEditData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierEditValues>({
    resolver: zodResolver(supplierEditSchema),
    defaultValues: {
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
    },
  });

  const onSubmit = async (data: SupplierEditValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.append("id", supplier.id);
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("email", data.email);
    formData.append("address", data.address);

    const result = await updateSupplier(undefined, formData);

    if (result?.error) {
      setServerError(result.error);
    } else if (result && "success" in result) {
      setOpen(false);
      router.refresh();
      toast.success("Нийлүүлэгч амжилттай шинэчлэгдлээ.");
    }
  };

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      {children ? (
        <Drawer.Trigger className="w-full">{children}</Drawer.Trigger>
      ) : (
        <Drawer.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        >
          <NotePencil className="size-3.5" />
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] [--bleed:3rem] dark:[--backdrop-opacity:0.4] z-50 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] z-50 fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Нийлүүлэгч засах
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {supplier.name}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
                    <div className="relative">
                      <Buildings className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-name"
                        className="pl-9"
                        placeholder="Болд ХХК"
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
                      placeholder="info@boldcompany.mn"
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

                {serverError ? (
                  <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                  <Drawer.Close
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  >
                    Цуцлах
                  </Drawer.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={buttonVariants({ variant: "default" })}
                  >
                    Хадгалах
                  </button>
                </div>
              </form>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
