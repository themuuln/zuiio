"use client";

import { Edit3, Package, Plus, Receipt, Trash2, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Customer, Vehicle } from "@/lib/types";

type ItemType = "service" | "part" | "custom";

interface QuoteLine {
  id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
}

let lineIdCounter = 0;
function newLineId() {
  return `line_${++lineIdCounter}_${Date.now()}`;
}

function calculateLineTotal(line: {
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
}): number {
  const gross = line.unit_price * line.quantity;
  const pctDisc = gross * (line.discount_percentage / 100);
  const flatDisc = line.discount_amount;
  return Math.max(gross - pctDisc - flatDisc, 0);
}

const quoteSchema = z.object({
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type QuoteValues = z.infer<typeof quoteSchema>;

const ITEM_TYPE_CONFIG: Record<
  ItemType,
  {
    icon: typeof Wrench;
    label: string;
    variant: "default" | "secondary" | "outline";
  }
> = {
  service: { icon: Wrench, label: "service", variant: "default" },
  part: { icon: Package, label: "part", variant: "secondary" },
  custom: { icon: Edit3, label: "custom", variant: "outline" },
};

export default function NewEstimatePage() {
  const t = useTranslations("estimates");
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<
    { id: string; name: string; default_price: number }[]
  >([]);
  const [searchingServices, setSearchingServices] = useState(false);

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { notes: "", terms: "" },
  });

  const addServiceLine = (svc: {
    id: string;
    name: string;
    default_price: number;
  }) => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "service",
        description: svc.name,
        quantity: 1,
        unit_price: Number(svc.default_price),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(svc.default_price),
      },
    ]);
  };

  const addPartLine = (part: {
    id: string;
    part_name: string;
    unit_price: number;
  }) => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "part",
        description: part.part_name,
        quantity: 1,
        unit_price: Number(part.unit_price),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(part.unit_price),
      },
    ]);
  };

  const addCustomLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "custom",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 0,
      },
    ]);
  };

  const updateLine = (id: string, updates: Partial<QuoteLine>) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        const updated = { ...line, ...updates };
        updated.line_total = calculateLineTotal(updated);
        return updated;
      }),
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const searchServices = (q: string) => {
    setServiceSearch(q);
    if (!q || q.length < 2) {
      setServices([]);
      return;
    }
    setSearchingServices(true);
    fetch(`/api/organizations/${orgId}/services?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(() => setServices([]))
      .finally(() => setSearchingServices(false));
  };

  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const lineDiscountTotal = 0;
  const quoteDiscountTotal =
    discountAmount + subtotal * (discountPercent / 100);
  const discountTotal = lineDiscountTotal + quoteDiscountTotal;
  const grandTotal = Math.max(subtotal - discountTotal + taxTotal, 0);

  const handleSave = async (status: string = "draft") => {
    if (!customer) {
      toast.error(t("pleaseSelectCustomer"));
      return;
    }
    if (!vehicle) {
      toast.error(t("pleaseSelectVehicle"));
      return;
    }
    if (lines.length === 0) {
      toast.error(t("addAtLeastOneItem"));
      return;
    }

    setSaving(true);
    try {
      const data = form.getValues();
      const res = await fetch(`/api/organizations/${orgId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          notes: data.notes || undefined,
          terms: data.terms || undefined,
          status,
          discount_amount: discountAmount,
          discount_percentage: discountPercent,
          tax_total: taxTotal,
          items: lines.map((l) => ({
            item_type: l.item_type,
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount_amount: l.discount_amount,
            discount_percentage: l.discount_percentage,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success(t("quoteCreated"));
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    } finally {
      setSaving(false);
    }
  };

  const [partSearch, setPartSearch] = useState("");
  const [parts, setParts] = useState<
    { id: string; part_name: string; unit_price: number }[]
  >([]);
  const [searchingParts, setSearchingParts] = useState(false);

  const searchParts = (q: string) => {
    setPartSearch(q);
    if (!q || q.length < 2) {
      setParts([]);
      return;
    }
    setSearchingParts(true);
    fetch(`/api/organizations/${orgId}/inventory?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setParts(d.data ?? []))
      .catch(() => setParts([]))
      .finally(() => setSearchingParts(false));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <Typography.H2>{t("newQuoteTitle")}</Typography.H2>
        <Typography.Text className="text-muted-foreground">
          {t("pageDescription")}
        </Typography.Text>
      </div>

      {/* Customer & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerSelect
          orgId={orgId}
          selectedCustomer={customer}
          onSelect={setCustomer}
          onClear={() => setCustomer(null)}
        />
        <VehicleSelect
          orgId={orgId}
          customerId={customer?.id ?? null}
          selectedVehicle={vehicle}
          onSelect={setVehicle}
          onClear={() => setVehicle(null)}
        />
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("lineItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Item Toolbar */}
          <div className="flex items-center gap-2 pb-4 border-b mb-4">
            <Sheet>
              <SheetTrigger>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" />
                  {t("addService")}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{t("addServiceTitle")}</SheetTitle>
                  <SheetDescription>
                    Search the service catalog
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <SearchInput
                    placeholder={t("searchServicesPlaceholder")}
                    onSearch={searchServices}
                    loading={searchingServices}
                    debounceMs={400}
                  />
                  <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                    {services.map((svc) => (
                      <Button
                        key={svc.id}
                        variant="ghost"
                        className="w-full justify-between p-3 h-auto"
                        onClick={() => {
                          addServiceLine(svc);
                          setServiceSearch("");
                          setServices([]);
                        }}
                      >
                        <span className="font-medium">{svc.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          ₮{Number(svc.default_price).toLocaleString()}
                        </span>
                      </Button>
                    ))}
                    {serviceSearch &&
                      services.length === 0 &&
                      !searchingServices && (
                        <Typography.Text className="text-sm text-muted-foreground p-4 text-center">
                          No services found
                        </Typography.Text>
                      )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" />
                  {t("addPart")}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{t("addPartTitle")}</SheetTitle>
                  <SheetDescription>Search the parts catalog</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <SearchInput
                    placeholder={t("searchPartsPlaceholder")}
                    onSearch={searchParts}
                    loading={searchingParts}
                    debounceMs={400}
                  />
                  <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                    {parts.map((part) => (
                      <Button
                        key={part.id}
                        variant="ghost"
                        className="w-full justify-between p-3 h-auto"
                        onClick={() => {
                          addPartLine(part);
                          setPartSearch("");
                          setParts([]);
                        }}
                      >
                        <span className="font-medium">{part.part_name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          ₮{Number(part.unit_price).toLocaleString()}
                        </span>
                      </Button>
                    ))}
                    {partSearch && parts.length === 0 && !searchingParts && (
                      <Typography.Text className="text-sm text-muted-foreground p-4 text-center">
                        No parts found
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="sm" onClick={addCustomLine}>
              <Plus className="size-4" />
              {t("addCustom")}
            </Button>
          </div>

          {/* Items Content */}
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="rounded-full bg-muted p-3">
                <Receipt className="size-6 text-muted-foreground" />
              </div>
              <Typography.Text className="text-sm font-medium">
                {t("noItemsTitle")}
              </Typography.Text>
              <Typography.Text className="text-xs text-muted-foreground text-center max-w-xs">
                {t("noItemsDescription")}
              </Typography.Text>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Disc %</div>
                <div className="col-span-1 text-right">Disc ₮</div>
                <div className="col-span-1 text-right">{t("total")}</div>
                <div className="col-span-1" />
              </div>

              {/* Line Items */}
              {lines.map((line, idx) => {
                const typeConfig = ITEM_TYPE_CONFIG[line.item_type];
                const TypeIcon = typeConfig.icon;
                return (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2 hover:bg-muted/50 transition-colors"
                  >
                    {/* Row Number */}
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {idx + 1}
                    </div>

                    {/* Description + Type Badge */}
                    <div className="col-span-4">
                      {line.item_type === "custom" ? (
                        <Input
                          placeholder={t("descriptionPlaceholder")}
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <Typography.Text className="text-sm truncate block">
                            {line.description}
                          </Typography.Text>
                          <Badge
                            variant={typeConfig.variant}
                            className="w-fit gap-1"
                          >
                            <TypeIcon className="size-2.5" />
                            {t(typeConfig.label)}
                          </Badge>
                        </div>
                      )}
                      {line.item_type === "custom" && (
                        <Badge
                          variant={typeConfig.variant}
                          className="w-fit gap-1 mt-1"
                        >
                          <TypeIcon className="size-2.5" />
                          {t(typeConfig.label)}
                        </Badge>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1,
                            ),
                          })
                        }
                        className="h-8 text-sm text-right"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={line.unit_price}
                        onChange={(e) =>
                          updateLine(line.id, {
                            unit_price: Math.max(
                              0,
                              parseInt(e.target.value, 10) || 0,
                            ),
                          })
                        }
                        className="h-8 text-sm text-right"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={line.discount_percentage}
                        onChange={(e) =>
                          updateLine(line.id, {
                            discount_percentage: Math.max(
                              0,
                              Math.min(100, parseInt(e.target.value, 10) || 0),
                            ),
                          })
                        }
                        className="h-8 text-sm text-right"
                      />
                    </div>

                    {/* Discount Amount */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={line.discount_amount}
                        onChange={(e) =>
                          updateLine(line.id, {
                            discount_amount: Math.max(
                              0,
                              parseInt(e.target.value, 10) || 0,
                            ),
                          })
                        }
                        className="h-8 text-sm text-right"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-1 text-right font-mono text-sm font-medium">
                      ₮{line.line_total.toLocaleString()}
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals Summary */}
      <Card>
        <CardContent className="pt-3">
          <div className="space-y-2.5 ml-auto w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-mono">₮{subtotal.toLocaleString()}</span>
            </div>

            {/* Quote-level Discount */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0">
                {t("discount")}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) =>
                    setDiscountPercent(
                      Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    )
                  }
                  className="h-7 w-14 text-xs text-right"
                  placeholder="%"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <span className="text-xs text-muted-foreground">+</span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-7 w-20 text-xs text-right"
                  placeholder="₮"
                />
              </div>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("discount")} {t("subtotal")}
                </span>
                <span className="font-mono text-destructive">
                  -₮{discountTotal.toLocaleString()}
                </span>
              </div>
            )}

            {/* Tax */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0">{t("tax")}</span>
              <Input
                type="number"
                min={0}
                step={1000}
                value={taxTotal}
                onChange={(e) =>
                  setTaxTotal(Math.max(0, Number(e.target.value) || 0))
                }
                className="h-7 w-24 text-xs text-right ml-auto"
                placeholder="₮"
              />
            </div>

            {/* Grand Total */}
            <div className="flex justify-between text-lg font-semibold border-t pt-2.5">
              <span>{t("grandTotal")}</span>
              <span className="font-mono">₮{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field>
          <FieldLabel>{t("notes")}</FieldLabel>
          <FieldContent>
            <Textarea
              placeholder={t("notesPlaceholder")}
              rows={3}
              {...form.register("notes")}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>{t("termsAndConditions")}</FieldLabel>
          <FieldContent>
            <Textarea
              placeholder={t("termsPlaceholder")}
              rows={3}
              {...form.register("terms")}
            />
          </FieldContent>
        </Field>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t pt-4">
        <Button variant="ghost" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={saving || lines.length === 0}
        >
          {saving ? t("saving") : t("saveAsDraft")}
        </Button>
        <Button
          onClick={() => handleSave("draft")}
          disabled={saving || lines.length === 0}
        >
          {saving ? t("saving") : t("createQuote")}
        </Button>
      </div>
    </div>
  );
}
