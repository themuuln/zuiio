"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { productKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

const bulkItemSchema = z.object({
  barcode: z.string().min(1, "Баркод шаардлагатай"),
  name: z.string().min(1, "Нэр шаардлагатай"),
  sale_price: z.number().min(0),
  cost_price: z.number().min(0),
  current_stock: z.number().min(0),
  unit: z.string().default("ширхэг"),
});

const bulkSchema = z.object({
  items: z.array(bulkItemSchema).min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type BulkValues = z.input<typeof bulkSchema>;

async function bulkCreateProducts(items: BulkValues["items"]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нэвтрээгүй");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) throw new Error("Байгууллага олдсонгүй");

  const products = items.map((item) => ({
    organization_id: profile.organization_id!,
    barcode: item.barcode,
    name: item.name,
    sale_price: item.sale_price,
    cost_price: item.cost_price,
    current_stock: item.current_stock,
    unit: item.unit,
  }));

  const { error } = await supabase.from("products").insert(products);
  if (error) throw new Error(error.message);
}

export default function BulkProductsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BulkValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      items: [
        {
          barcode: "",
          name: "",
          sale_price: 0,
          cost_price: 0,
          current_stock: 0,
          unit: "ширхэг",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const submitMutation = useMutation({
    mutationFn: (data: BulkValues) => bulkCreateProducts(data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
      toast.success("Бүтээгдэхүүнүүд амжилттай нэмэгдлээ.");
      reset();
    },
    onError: (err) => {
      toast.error(err.message || "Бүтээгдэхүүн нэмэхэд алдаа гарлаа.");
    },
  });

  const onSubmit = (data: BulkValues) => {
    submitMutation.mutate(data);
  };

  function handleCSVImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());

      if (lines.length < 2) {
        setCsvError("CSV файл хэтэрхий хоосон байна.");
        return;
      }

      const items: BulkValues["items"] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 2) continue;

        items.push({
          barcode: cols[0] || `BULK-${Date.now()}-${i}`,
          name: cols[1] || "Бүтээгдэхүүн",
          sale_price: Number.parseFloat(cols[2]) || 0,
          cost_price: Number.parseFloat(cols[3]) || 0,
          current_stock: Number.parseFloat(cols[4]) || 0,
          unit: cols[5] || "ширхэг",
        });
      }

      if (items.length === 0) {
        setCsvError("CSV файлаас бараа уншиж чадсангүй.");
        return;
      }

      // Replace form items with imported ones
      while (fields.length > 0) remove(0);
      for (const item of items) {
        append(item);
      }
      toast.success(`${items.length} бараа импортлогдлоо.`);
    };
    reader.readAsText(file);
  }

  function downloadCSVTemplate() {
    const header = "barcode,name,sale_price,cost_price,current_stock,unit";
    const row = "8801234567890,Жишээ бүтээгдэхүүн,5000,3000,10,ширхэг";
    const csv = [header, row].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barcode-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title="Баркод бөөнөөр"
      description="Баркод ашиглан бүтээгдэхүүнийг бөөнөөр нэмэх, импортлох"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Бүтээгдэхүүнүүд</CardTitle>
            <CardDescription>
              Баркод, нэр, үнийг оруулан бөөнөөр нэмэх
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
                >
                  <div className="w-36">
                    <FieldLabel
                      htmlFor={`items.${index}.barcode`}
                      className="mb-1"
                    >
                      Баркод
                    </FieldLabel>
                    <Input
                      id={`items.${index}.barcode`}
                      placeholder="8801234567890"
                      {...register(`items.${index}.barcode`)}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <FieldLabel
                      htmlFor={`items.${index}.name`}
                      className="mb-1"
                    >
                      Нэр
                    </FieldLabel>
                    <Input
                      id={`items.${index}.name`}
                      placeholder="Бүтээгдэхүүний нэр"
                      {...register(`items.${index}.name`)}
                    />
                  </div>
                  <div className="w-24">
                    <FieldLabel
                      htmlFor={`items.${index}.sale_price`}
                      className="mb-1"
                    >
                      Борлуулах үнэ
                    </FieldLabel>
                    <Input
                      id={`items.${index}.sale_price`}
                      type="number"
                      min="0"
                      step="any"
                      {...register(`items.${index}.sale_price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="w-24">
                    <FieldLabel
                      htmlFor={`items.${index}.cost_price`}
                      className="mb-1"
                    >
                      Өртөг
                    </FieldLabel>
                    <Input
                      id={`items.${index}.cost_price`}
                      type="number"
                      min="0"
                      step="any"
                      {...register(`items.${index}.cost_price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="w-20">
                    <FieldLabel
                      htmlFor={`items.${index}.current_stock`}
                      className="mb-1"
                    >
                      Нөөц
                    </FieldLabel>
                    <Input
                      id={`items.${index}.current_stock`}
                      type="number"
                      min="0"
                      step="any"
                      {...register(`items.${index}.current_stock`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive mb-0.5"
                      onClick={() => remove(index)}
                    >
                      Хасах
                    </Button>
                  )}
                </div>
              ))}

              {errors.items && (
                <p className="text-xs text-destructive">
                  {typeof errors.items === "object" && "message" in errors.items
                    ? errors.items.message
                    : ""}
                  {"root" in (errors.items ?? {})
                    ? (errors.items as { root: { message?: string } }).root
                        ?.message
                    : ""}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      barcode: "",
                      name: "",
                      sale_price: 0,
                      cost_price: 0,
                      current_stock: 0,
                      unit: "ширхэг",
                    })
                  }
                >
                  <Barcode data-icon="inline-start" />
                  Мөр нэмэх
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  size="sm"
                >
                  {submitMutation.isPending
                    ? "Хадгалж байна..."
                    : `${fields.length} бүтээгдэхүүн хадгалах`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV импорт</CardTitle>
              <CardDescription>
                Баркод, нэр, үнийг CSV-оос оруулах
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple data-icon="inline-start" />
                CSV файл сонгох
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={downloadCSVTemplate}
              >
                <DownloadSimple data-icon="inline-start" />
                Загвар татах
              </Button>
              {csvError && (
                <p className="text-xs text-destructive">{csvError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                CSV формат: barcode, name, sale_price, cost_price,
                current_stock, unit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Баркод уншигч</CardTitle>
              <CardDescription>
                Баркод сканнер ашиглан хурдан бүртгэх
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Баркод сканнераар унших үед курсор автоматаар дараагийн мөрөнд
                шилжиж, хурдан бүртгэх боломжтой.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
