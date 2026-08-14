"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useEffect, useRef, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { useOrgId } from "@/lib/hooks/use-org-id";
import { productionKeys, qualityKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { createQualityCheck, uploadDefectPhoto } from "./quality-actions";

// ─── Schema ────────────────────────────────────────────────────────────────

const qualityCheckSchema = z.object({
  production_order_id: z.string().min(1, "Захиалга сонгоно уу"),
  production_stage_id: z.string().optional().nullable(),
  check_type: z.enum(["in_process", "final"]),
  result: z.enum(["pass", "fail", "conditional"]),
  defect_description: z.string().optional().nullable(),
});

type QualityCheckValues = z.infer<typeof qualityCheckSchema>;

// ─── Types for data fetching ───────────────────────────────────────────────

interface OrderOption {
  id: string;
  order_number: string;
}

interface StageOption {
  id: string;
  stage_name: string;
  stage_order: number;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

function useProductionOrders() {
  const { organizationId } = useOrgId();
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const supabase = createClient();
    supabase
      .from("production_orders")
      .select("id, order_number")
      .eq("organization_id", organizationId)
      .in("status", ["in_progress", "completed"])
      .is("deleted_at", null)
      .order("order_number", { ascending: false })
      .then(({ data, error }) => {
        if (error) capture(error);
        if (data) setOrders(data);
        setLoading(false);
      });
  }, [organizationId]);

  return { orders, loading };
}

function useOrderStages(orderId: string | null) {
  const [stages, setStages] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setStages([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("production_stages")
      .select("id, stage_name, stage_order")
      .eq("production_order_id", orderId)
      .order("stage_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) capture(error);
        if (data) setStages(data);
        setLoading(false);
      });
  }, [orderId]);

  return { stages, loading };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function QualityCreateDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { orders, loading: ordersLoading } = useProductionOrders();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QualityCheckValues>({
    resolver: zodResolver(qualityCheckSchema) as Resolver<QualityCheckValues>,
    defaultValues: {
      production_order_id: "",
      production_stage_id: "",
      check_type: "in_process",
      result: "pass",
      defect_description: "",
    },
  });

  const selectedOrderId = watch("production_order_id");
  const selectedResult = watch("result");
  const { stages, loading: stagesLoading } = useOrderStages(selectedOrderId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset stages when order changes
  useEffect(() => {
    if (selectedOrderId) {
      reset((prev) => ({ ...prev, production_stage_id: "" }));
    }
  }, [selectedOrderId, reset]);

  const onSubmit = async (data: QualityCheckValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Upload photos first
      const uploadedPaths: string[] = [];
      for (const file of selectedFiles) {
        const uploadResult = await uploadDefectPhoto(
          data.production_order_id,
          file,
        );
        if (!uploadResult || "error" in uploadResult) {
          setSubmitError(
            uploadResult?.error ?? "Зураг байршуулахад алдаа гарлаа.",
          );
          return;
        }
        uploadedPaths.push(uploadResult.data.path);
      }

      // Create quality check record
      const result = await createQualityCheck({
        production_order_id: data.production_order_id,
        production_stage_id: data.production_stage_id || null,
        check_type: data.check_type,
        result: data.result,
        defect_description: data.defect_description || null,
        defect_photos: uploadedPaths.length > 0 ? uploadedPaths : null,
      });

      if (!result || "error" in result) {
        setSubmitError(result?.error ?? "Алдаа гарлаа");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: qualityKeys.all(),
      });
      // Also invalidate production queries since completion validation depends on quality checks
      await queryClient.invalidateQueries({
        queryKey: productionKeys.all(),
      });

      handleClose();
      toast.success("Чанарын шалгалт бүртгэгдлээ.");
    } catch (err) {
      capture(err, { context: "quality: createCheck UI" });
      setSubmitError("Чанарын шалгалт бүртгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleClose() {
    onOpenChange(false);
    reset();
    setSelectedFiles([]);
    setSubmitError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <SlideInDrawer
      key={String(open)}
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(next);
      }}
      title="Шинэ шалгалт"
      description="Чанарын шалгалт бүртгэх"
      panelWidth="36rem"
      trigger={
        <Button variant="default" size="sm">
          <Plus className="size-4 mr-1.5" />
          Шинэ шалгалт
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={handleClose} />
          <DrawerSubmit
            form="quality-check-create-form"
            isPending={isSubmitting}
            label="Бүртгэх"
            loadingLabel="Бүртгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="quality-check-create-form"
      >
        {submitError && <ErrorBanner error={submitError} />}

        <FieldGroup>
          {/* Production order select */}
          <Field>
            <FieldLabel htmlFor="qc-order">Захиалга</FieldLabel>
            <Controller
              control={control}
              name="production_order_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={ordersLoading}
                >
                  <SelectTrigger
                    id="qc-order"
                    aria-label="Үйлдвэрлэлийн захиалга сонгох"
                  >
                    <SelectValue
                      placeholder={
                        ordersLoading ? "Ачаалж байна..." : "Захиалга сонго..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number}
                      </SelectItem>
                    ))}
                    {orders.length === 0 && !ordersLoading && (
                      <SelectItem value="__none" disabled>
                        Захиалга байхгүй
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.production_order_id && (
              <p className="text-xs text-destructive" role="alert">
                {errors.production_order_id.message}
              </p>
            )}
          </Field>

          {/* Stage select (optional) */}
          <Field>
            <FieldLabel htmlFor="qc-stage">Шат (сонголттой)</FieldLabel>
            <Controller
              control={control}
              name="production_stage_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                  disabled={!selectedOrderId || stagesLoading}
                >
                  <SelectTrigger
                    id="qc-stage"
                    aria-label="Үйлдвэрлэлийн шат сонгох"
                  >
                    <SelectValue
                      placeholder={
                        !selectedOrderId
                          ? "Эхлээд захиалга сонгоно уу"
                          : stagesLoading
                            ? "Ачаалж байна..."
                            : "Шат сонго..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.stage_name}
                      </SelectItem>
                    ))}
                    {stages.length === 0 &&
                      !stagesLoading &&
                      selectedOrderId && (
                        <SelectItem value="__none" disabled>
                          Шат байхгүй
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Check type */}
          <Field>
            <FieldLabel htmlFor="qc-type">Шалгалтын төрөл</FieldLabel>
            <Controller
              control={control}
              name="check_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="qc-type"
                    aria-label="Шалгалтын төрөл сонгох"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_process">
                      Үйлдвэрлэлийн явцад
                    </SelectItem>
                    <SelectItem value="final">Эцэслэх шалгалт</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Result */}
          <Field>
            <FieldLabel htmlFor="qc-result">Үр дүн</FieldLabel>
            <Controller
              control={control}
              name="result"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="qc-result"
                    aria-label="Шалгалтын үр дүн сонгох"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Өнгөрсөн (Pass)</SelectItem>
                    <SelectItem value="fail">Унасан (Fail)</SelectItem>
                    <SelectItem value="conditional">
                      Нөхцөлт (Conditional)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Defect description — shown when result is not pass */}
          {selectedResult !== "pass" && (
            <Field>
              <FieldLabel htmlFor="qc-defect">Дутагдлын тайлаг</FieldLabel>
              <Textarea
                id="qc-defect"
                placeholder="Дутагдлын талаар тайлбар бичнэ үү..."
                className="min-h-[100px]"
                {...register("defect_description")}
              />
            </Field>
          )}

          {/* Photo upload */}
          <Field>
            <FieldLabel>Зургууд</FieldLabel>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="qc-photos"
                aria-label="Дутагдлын зураг нэмэх"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Зураг нэмэх
              </Button>

              {selectedFiles.length > 0 && (
                <ul className="space-y-1" aria-label="Сонгосон зургууд">
                  {selectedFiles.map((file, i) => (
                    <li
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 shrink-0 text-destructive"
                        onClick={() => removeFile(i)}
                        aria-label={`${file.name} устгах`}
                      >
                        Устгах
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
        </FieldGroup>
      </form>
    </SlideInDrawer>
  );
}
