"use client";

import { Drawer } from "@base-ui/react/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Folder, NotePencil, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateCategory } from "@/app/(dashboard)/inventory/categories/actions";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
}: {
  category: CategoryEditData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryEditValues>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: {
      name: category.name,
    },
  });

  const onSubmit = async (data: CategoryEditValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.append("id", category.id);
    formData.append("name", data.name);

    const result = await updateCategory(undefined, formData);

    if (result?.error) {
      setServerError(result.error);
    } else if (result && "success" in result) {
      setOpen(false);
      router.refresh();
      toast.success("Ангилал амжилттай шинэчлэгдлээ.");
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
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Ангилал засах
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {category.name}
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
