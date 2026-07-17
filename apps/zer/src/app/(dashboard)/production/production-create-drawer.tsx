"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useEffect, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { productionKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { createProductionOrder } from "./production-actions";

const productionSchema = z.object({
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  bom_id: z.string().min(1, "BOM сонгоно уу"),
  quantity: z.coerce.number().min(1, "Тоо хэмжээ 1-ээс их байх ёстой"),
  branch_id: z.string().min(1, "Салбар сонгоно уу"),
  sale_item_id: z.string().optional().nullable(),
  planned_start_date: z.string().optional().nullable(),
  planned_end_date: z.string().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  notes: z.string().optional().nullable(),
});

type ProductionValues = z.infer<typeof productionSchema>;

interface ProductOption {
  id: string;
  name: string;
}

interface BomOption {
  id: string;
  version: number;
}

interface BranchOption {
  id: string;
  name: string;
}

function useProducts() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: userData }) => {
      if (!userData?.user) return;
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile?.organization_id) return;
          supabase
            .from("products")
            .select("id, name")
            .eq("organization_id", profile.organization_id)
            .is("deleted_at", null)
            .order("name")
            .then(({ data, error }) => {
              if (error) capture(error);
              if (data) setProducts(data);
              setLoading(false);
            });
        });
    });
  }, []);

  return { products, loading };
}

function useBoms(productId: string | null) {
  const [boms, setBoms] = useState<BomOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setBoms([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // NOTE: product_boms table needs migration to be applied first.
    // Once types are regenerated, use: .from("product_boms").select("id, version")
    supabase.auth.getUser().then(({ data: userData }) => {
      if (!userData?.user) {
        setLoading(false);
        return;
      }
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile?.organization_id) {
            setLoading(false);
            return;
          }
          supabase
            .from("product_boms")
            .select("id, version")
            .eq("product_id", productId)
            .eq("organization_id", profile.organization_id)
            .eq("status", "active")
            .is("deleted_at", null)
            .order("version", { ascending: false })
            .then(({ data, error }) => {
              if (error) capture(error);
              if (data) setBoms(data);
              setLoading(false);
            });
        });
    });
  }, [productId]);

  return { boms, loading };
}

function useBranches() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: userData }) => {
      if (!userData?.user) return;
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile?.organization_id) return;
          supabase
            .from("branches")
            .select("id, name")
            .eq("organization_id", profile.organization_id)
            .is("deleted_at", null)
            .order("name")
            .then(({ data, error }) => {
              if (error) capture(error);
              if (data) setBranches(data);
              setLoading(false);
            });
        });
    });
  }, []);

  return { branches, loading };
}

export function ProductionCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { products, loading: productsLoading } = useProducts();
  const { branches, loading: branchesLoading } = useBranches();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductionValues>({
    resolver: zodResolver(productionSchema) as Resolver<ProductionValues>,
    defaultValues: {
      product_id: "",
      bom_id: "",
      quantity: 1,
      branch_id: "",
      sale_item_id: "",
      planned_start_date: "",
      planned_end_date: "",
      priority: "normal",
      notes: "",
    },
  });

  const selectedProductId = watch("product_id");
  const { boms, loading: bomsLoading } = useBoms(selectedProductId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-select first active BOM when boms load
  useEffect(() => {
    if (boms.length === 1 && !watch("bom_id")) {
      reset((prev) => ({ ...prev, bom_id: boms[0].id }));
    }
  }, [boms, reset, watch]);

  const onSubmit = async (data: ProductionValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createProductionOrder({
        product_id: data.product_id,
        bom_id: data.bom_id,
        quantity: data.quantity,
        branch_id: data.branch_id,
        sale_item_id: data.sale_item_id || undefined,
        planned_start_date: data.planned_start_date || undefined,
        planned_end_date: data.planned_end_date || undefined,
        priority: data.priority,
        notes: data.notes || undefined,
      });
      if (!result || "error" in result) {
        setSubmitError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productionKeys.all(),
      });
      setOpen(false);
      reset();
      toast.success("Үйлдвэрлэлийн захиалга үүсгэгдлээ.");
    } catch (err) {
      capture(err, { context: "production: createOrder UI" });
      setSubmitError("Үйлдвэрлэлийн захиалга үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleClose() {
    setOpen(false);
    reset();
    setSubmitError(null);
  }

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setOpen(next);
      }}
      title="Шинэ захиалга"
      description="Үйлдвэрлэлийн захиалга үүсгэх"
      panelWidth="36rem"
      trigger={
        <Button variant="default" size="sm">
          Шинэ захиалга
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={handleClose} />
          <DrawerSubmit
            form="production-create-form"
            isPending={isSubmitting}
            label="Үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="production-create-form"
      >
        {submitError && <ErrorBanner error={submitError} />}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="production-product">Бүтээгдэхүүн</FieldLabel>
            <Controller
              control={control}
              name="product_id"
              render={({ field }) => {
                const selected = products.find((p) => p.id === field.value);
                return (
                  <Combobox
                    items={products}
                    value={selected ?? null}
                    onValueChange={(next) => {
                      field.onChange(next?.id ?? "");
                      reset((prev) => ({ ...prev, bom_id: "" }));
                    }}
                    itemToStringLabel={(p) => p?.name ?? ""}
                    inputValue={selected?.name ?? ""}
                    onInputValueChange={() => {}}
                  >
                    <ComboboxInput
                      id="production-product"
                      placeholder="Бүтээгдэхүүн сонго..."
                      showTrigger
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {productsLoading
                          ? "Ачаалж байна..."
                          : "Бүтээгдэхүүн байхгүй"}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {products.map((p) => (
                          <ComboboxItem key={p.id} value={p}>
                            {p.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                );
              }}
            />
            {errors.product_id && (
              <p className="text-xs text-destructive" role="alert">
                {errors.product_id.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="production-bom">BOM</FieldLabel>
            <Controller
              control={control}
              name="bom_id"
              render={({ field }) => {
                const selected = boms.find((b) => b.id === field.value);
                return (
                  <Combobox
                    items={boms}
                    value={selected ?? null}
                    onValueChange={(next) => field.onChange(next?.id ?? "")}
                    itemToStringLabel={(b) => b ? `BOM v${b.version}` : ""}
                    inputValue={selected ? `BOM v${selected.version}` : ""}
                    onInputValueChange={() => {}}
                  >
                    <ComboboxInput
                      id="production-bom"
                      placeholder={
                        selectedProductId
                          ? "BOM сонго..."
                          : "Эхлээд бүтээгдэхүүн сонго"
                      }
                      showTrigger
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {bomsLoading
                          ? "Ачаалж байна..."
                          : "Идэвхтэй BOM байхгүй"}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {boms.map((b) => (
                          <ComboboxItem key={b.id} value={b}>
                            BOM v{b.version}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                );
              }}
            />
            {errors.bom_id && (
              <p className="text-xs text-destructive" role="alert">
                {errors.bom_id.message}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="production-quantity">Тоо</FieldLabel>
              <Input
                id="production-quantity"
                type="number"
                step="1"
                min="1"
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.quantity.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="production-priority">Тэргүүлэх</FieldLabel>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="production-priority">
                      <SelectValue placeholder="Тэргүүлэх" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Бага</SelectItem>
                      <SelectItem value="normal">Хэвийн</SelectItem>
                      <SelectItem value="high">Өндөр</SelectItem>
                      <SelectItem value="urgent">Яаралтай</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="production-branch">Салбар</FieldLabel>
            <Controller
              control={control}
              name="branch_id"
              render={({ field }) => {
                const selected = branches.find((b) => b.id === field.value);
                return (
                  <Combobox
                    items={branches}
                    value={selected ?? null}
                    onValueChange={(next) => field.onChange(next?.id ?? "")}
                    itemToStringLabel={(b) => b?.name ?? ""}
                    inputValue={selected?.name ?? ""}
                    onInputValueChange={() => {}}
                  >
                    <ComboboxInput
                      id="production-branch"
                      placeholder="Салбар сонго..."
                      showTrigger
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {branchesLoading ? "Ачаалж байна..." : "Салбар байхгүй"}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {branches.map((b) => (
                          <ComboboxItem key={b.id} value={b}>
                            {b.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                );
              }}
            />
            {errors.branch_id && (
              <p className="text-xs text-destructive" role="alert">
                {errors.branch_id.message}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="production-start-date">
                Төлөвлөсөн эхлэх
              </FieldLabel>
              <Input
                id="production-start-date"
                type="date"
                {...register("planned_start_date")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="production-end-date">
                Төлөвлөсөн дуусах
              </FieldLabel>
              <Input
                id="production-end-date"
                type="date"
                {...register("planned_end_date")}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="production-notes">
              Тэмдэглэл{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Textarea
              id="production-notes"
              placeholder="Нэмэлт тэмдэглэл..."
              {...register("notes")}
            />
          </Field>
        </FieldGroup>
      </form>
    </SlideInDrawer>
  );
}
