"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Folder, Plus, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createCategory } from "@/app/(dashboard)/inventory/categories/actions";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { categoryKeys } from "@/lib/query/keys";

export function CategoryCreateDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoryMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createCategory(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all() });
      const snapshot = queryClient.getQueriesData({
        queryKey: categoryKeys.all(),
      });

      const name = formData.get("name")?.toString() ?? "";
      const optimisticCategory = {
        id: `opt-${Date.now()}`,
        name,
        product_count: 0,
      };

      queryClient.setQueriesData(
        { queryKey: categoryKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return [optimisticCategory, ...oldData];
          }
          return oldData;
        },
      );

      return { snapshot };
    },
    onSuccess: () => {
      setOpen(false);
      router.refresh();
      toast.success("Ангилал амжилттай үүсгэгдлээ.");
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Ангилал үүсгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (categoryMutation.isPending) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim() ?? "";

    if (!name) {
      toast.error("Ангиллын нэр шаардлагатай.");
      return;
    }

    categoryMutation.mutate(formData);
  };

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={buttonVariants({ variant: "default" })}>
        <Plus className="size-4" />
        Ангилал нэмэх
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Ангилал нэмэх
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    Бүтээгдэхүүний шинэ ангилал үүсгэх.
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="create-name">Нэр</FieldLabel>
                    <div className="relative">
                      <Folder className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="create-name"
                        name="name"
                        required
                        className="pl-9"
                        placeholder="Хоол, ундаа"
                      />
                    </div>
                  </Field>
                </FieldGroup>

                {categoryMutation.error ? (
                  <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {categoryMutation.error.message}
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
                    disabled={categoryMutation.isPending}
                    className={buttonVariants({ variant: "default" })}
                  >
                    {categoryMutation.isPending ? "Хадгалах..." : "Хадгалах"}
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
