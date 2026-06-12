"use client";

import {
  ArrowLeft,
  Edit3,
  Package,
  Plus,
  Receipt,
  Save,
  Send,
  Wrench,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import type { Customer, Vehicle } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type ItemType = "service" | "part" | "custom";

interface QuoteLine {
  id: string;
  item_type: ItemType;
  source_service_id?: string | null;
  source_part_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
}

const quoteSchema = z.object({
  notes: z.string().optional(),
  terms: z.string().optional(),
  valid_until: z.string().optional(),
});

type QuoteValues = z.infer<typeof quoteSchema>;

const ITEM_TYPE_CONFIG: Record<
  ItemType,
  {
    icon: typeof Wrench;
    label: string;
    badge: "default" | "secondary" | "outline";
  }
> = {
  service: { icon: Wrench, label: "service", badge: "default" },
  part: { icon: Package, label: "part", badge: "secondary" },
  custom: { icon: Edit3, label: "custom", badge: "outline" },
};

let lineIdCounter = 0;
function createLineId() {
  lineIdCounter += 1;
  return `estimate-line-${lineIdCounter}-${Date.now()}`;
}

function calculateLineTotal(line: {
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
}) {
  const gross = line.quantity * line.unit_price;
  const percentageDiscount = gross * (line.discount_percentage / 100);
  return Math.max(gross - percentageDiscount - line.discount_amount, 0);
}

export default function NewEstimatePage() {
  const t = useTranslations("estimates");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";
  const selectedBranchId = useSelectedBranchId();
  const branchId = selectedBranchId === "all" ? null : selectedBranchId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [savingState, setSavingState] = useState<"draft" | "sent" | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [nuatEnabled, setNuatEnabled] = useState(false);
  const [taxTotal, setTaxTotal] = useState(0);

  // Get org tax rate for auto-calculation
  const defaultTaxRate =
    (
      org as Record<string, unknown> as {
        settings?: { default_tax_rate?: number };
      }
    )?.settings?.default_tax_rate ?? 10;

  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<
    { id: string; name: string; default_price: number }[]
  >([]);
  const [searchingServices, setSearchingServices] = useState(false);

  const [partSearch, setPartSearch] = useState("");
  const [parts, setParts] = useState<
    { id: string; part_name: string; unit_price: number }[]
  >([]);
  const [searchingParts, setSearchingParts] = useState(false);

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      notes: "",
      terms: "",
      valid_until: "",
    },
  });

  const addServiceLine = (service: {
    id: string;
    name: string;
    default_price: number;
  }) => {
    setLines((current) => [
      ...current,
      {
        id: createLineId(),
        item_type: "service",
        source_service_id: service.id,
        description: service.name,
        quantity: 1,
        unit_price: Number(service.default_price ?? 0),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(service.default_price ?? 0),
      },
    ]);
  };

  const addPartLine = (part: {
    id: string;
    part_name: string;
    unit_price: number;
  }) => {
    setLines((current) => [
      ...current,
      {
        id: createLineId(),
        item_type: "part",
        source_part_id: part.id,
        description: part.part_name,
        quantity: 1,
        unit_price: Number(part.unit_price ?? 0),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(part.unit_price ?? 0),
      },
    ]);
  };

  const addCustomLine = () => {
    setLines((current) => [
      ...current,
      {
        id: createLineId(),
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

  const updateLine = (id: string, patch: Partial<QuoteLine>) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...patch };
        next.line_total = calculateLineTotal(next);
        return next;
      }),
    );
  };

  const removeLine = (id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  };

  const searchServices = async (query: string) => {
    setServiceSearch(query);
    if (!orgId || query.trim().length < 2) {
      setServices([]);
      return;
    }

    setSearchingServices(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/services?q=${encodeURIComponent(query.trim())}`,
      );
      const json = await res.json();
      setServices(json.data ?? []);
    } catch {
      setServices([]);
    } finally {
      setSearchingServices(false);
    }
  };

  const searchParts = async (query: string) => {
    setPartSearch(query);
    if (!orgId || query.trim().length < 2) {
      setParts([]);
      return;
    }

    setSearchingParts(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory?q=${encodeURIComponent(query.trim())}`,
      );
      const json = await res.json();
      setParts(json.data ?? []);
    } catch {
      setParts([]);
    } finally {
      setSearchingParts(false);
    }
  };

  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const quoteDiscountTotal =
    discountAmount + subtotal * (discountPercent / 100);
  // Auto-calculate tax when НӨАТ is enabled
  const calculatedTax = nuatEnabled
    ? Math.round((subtotal - quoteDiscountTotal) * defaultTaxRate) / 100
    : 0;
  const effectiveTax = nuatEnabled ? calculatedTax : taxTotal;
  const grandTotal = Math.max(subtotal - quoteDiscountTotal + effectiveTax, 0);

  const handleSave = async (status: "draft" | "sent") => {
    if (!orgId) return;
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
    if (lines.some((line) => !line.description.trim())) {
      toast.error(t("description"));
      return;
    }

    setSavingState(status);

    try {
      const values = form.getValues();
      const res = await fetch(`/api/organizations/${orgId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          branchId,
          status,
          notes: values.notes?.trim() || undefined,
          terms: values.terms?.trim() || undefined,
          valid_until: values.valid_until || undefined,
          discount_amount: discountAmount,
          discount_percentage: discountPercent,
          tax_total: effectiveTax,
          items: lines.map((line, index) => ({
            item_type: line.item_type,
            source_service_id: line.source_service_id ?? null,
            source_part_id: line.source_part_id ?? null,
            description: line.description.trim(),
            quantity: line.quantity,
            unit_price: line.unit_price,
            discount_amount: line.discount_amount,
            discount_percentage: line.discount_percentage,
            sort_order: index,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success(t("quoteCreated"));
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToSave"));
    } finally {
      setSavingState(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
              {commonT("back")}
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                <Receipt className="size-3.5" />
                {t("status_draft")}
              </Badge>
              {branchId && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  {commonT("branch")}
                </Badge>
              )}
            </div>

            <div>
              <Typography.H1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("newQuoteTitle")}
              </Typography.H1>
              <Typography.Muted className="mt-1 max-w-2xl text-sm">
                {t("pageDescription")}
              </Typography.Muted>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3 xl:min-w-[420px]">
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("subtotal")}
              </Typography.Text>
              <Typography.Text className="mt-1 block font-mono text-lg font-semibold">
                {formatCurrency(subtotal)}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("discount")}
              </Typography.Text>
              <Typography.Text className="mt-1 block font-mono text-lg font-semibold">
                {formatCurrency(quoteDiscountTotal)}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("grandTotal")}
              </Typography.Text>
              <Typography.Text className="mt-1 block font-mono text-lg font-semibold">
                {formatCurrency(grandTotal)}
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("customerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <CustomerSelect
                orgId={orgId}
                selectedCustomer={customer}
                onSelect={setCustomer}
                onClear={() => {
                  setCustomer(null);
                  setVehicle(null);
                }}
              />
              <VehicleSelect
                orgId={orgId}
                customerId={customer?.id ?? null}
                selectedVehicle={vehicle}
                onSelect={setVehicle}
                onClear={() => setVehicle(null)}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base">{t("lineItems")}</CardTitle>
                  <Typography.Muted className="mt-1">
                    {t("noItemsDescription")}
                  </Typography.Muted>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Sheet>
                    <SheetTrigger
                      render={<Button variant="outline" size="sm" />}
                    >
                      <Plus className="size-4" />
                      {t("addService")}
                    </SheetTrigger>
                    <SheetContent side="right" size="lg" className="w-full">
                      <SheetHeader>
                        <SheetTitle>{t("addServiceTitle")}</SheetTitle>
                        <SheetDescription>
                          {t("searchServicesPlaceholder")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 p-4">
                        <SearchInput
                          placeholder={t("searchServicesPlaceholder")}
                          onSearch={searchServices}
                          loading={searchingServices}
                          debounceMs={400}
                        />
                        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
                          {services.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
                              onClick={() => {
                                addServiceLine(service);
                                setServiceSearch("");
                                setServices([]);
                              }}
                            >
                              <div>
                                <Typography.Text className="font-medium">
                                  {service.name}
                                </Typography.Text>
                              </div>
                              <Typography.Text className="font-mono text-sm text-muted-foreground">
                                {formatCurrency(
                                  Number(service.default_price ?? 0),
                                )}
                              </Typography.Text>
                            </button>
                          ))}
                          {serviceSearch &&
                          services.length === 0 &&
                          !searchingServices ? (
                            <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                              {commonT("noResults")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Sheet>
                    <SheetTrigger
                      render={<Button variant="outline" size="sm" />}
                    >
                      <Plus className="size-4" />
                      {t("addPart")}
                    </SheetTrigger>
                    <SheetContent side="right" size="lg" className="w-full">
                      <SheetHeader>
                        <SheetTitle>{t("addPartTitle")}</SheetTitle>
                        <SheetDescription>
                          {t("searchPartsPlaceholder")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 p-4">
                        <SearchInput
                          placeholder={t("searchPartsPlaceholder")}
                          onSearch={searchParts}
                          loading={searchingParts}
                          debounceMs={400}
                        />
                        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
                          {parts.map((part) => (
                            <button
                              key={part.id}
                              type="button"
                              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
                              onClick={() => {
                                addPartLine(part);
                                setPartSearch("");
                                setParts([]);
                              }}
                            >
                              <div>
                                <Typography.Text className="font-medium">
                                  {part.part_name}
                                </Typography.Text>
                              </div>
                              <Typography.Text className="font-mono text-sm text-muted-foreground">
                                {formatCurrency(Number(part.unit_price ?? 0))}
                              </Typography.Text>
                            </button>
                          ))}
                          {partSearch &&
                          parts.length === 0 &&
                          !searchingParts ? (
                            <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                              {commonT("noResults")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Button variant="outline" size="sm" onClick={addCustomLine}>
                    <Plus className="size-4" />
                    {t("addCustom")}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Receipt className="size-6 text-muted-foreground" />
                  </div>
                  <Typography.Text className="font-medium">
                    {t("noItemsTitle")}
                  </Typography.Text>
                  <Typography.Muted className="max-w-sm">
                    {t("noItemsDescription")}
                  </Typography.Muted>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {lines.map((line, index) => {
                    const config = ITEM_TYPE_CONFIG[line.item_type];
                    const TypeIcon = config.icon;

                    return (
                      <div
                        key={line.id}
                        className="rounded-2xl border border-border/60 bg-card p-4"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                                {index + 1}
                              </div>
                              <div>
                                <Badge
                                  variant={config.badge}
                                  className="rounded-full px-2.5 py-0.5"
                                >
                                  <TypeIcon className="size-3.5" />
                                  {t(config.label)}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeLine(line.id)}
                            >
                              {commonT("delete")}
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
                            <Field>
                              <FieldLabel>{t("description")}</FieldLabel>
                              <FieldContent>
                                <Input
                                  value={line.description}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      description: event.target.value,
                                    })
                                  }
                                  placeholder={t("descriptionPlaceholder")}
                                  className="h-11"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel>{t("qty")}</FieldLabel>
                              <FieldContent>
                                <Input
                                  type="number"
                                  min={1}
                                  value={line.quantity}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      quantity: Math.max(
                                        1,
                                        Number(event.target.value) || 1,
                                      ),
                                    })
                                  }
                                  className="h-11 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel>{t("unitPrice")}</FieldLabel>
                              <FieldContent>
                                <Input
                                  type="number"
                                  min={0}
                                  value={line.unit_price}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      unit_price: Math.max(
                                        0,
                                        Number(event.target.value) || 0,
                                      ),
                                    })
                                  }
                                  className="h-11 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel>{t("discountPercent")}</FieldLabel>
                              <FieldContent>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={line.discount_percentage}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      discount_percentage: Math.max(
                                        0,
                                        Math.min(
                                          100,
                                          Number(event.target.value) || 0,
                                        ),
                                      ),
                                    })
                                  }
                                  className="h-11 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel>{t("discountAmount")}</FieldLabel>
                              <FieldContent>
                                <Input
                                  type="number"
                                  min={0}
                                  value={line.discount_amount}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      discount_amount: Math.max(
                                        0,
                                        Number(event.target.value) || 0,
                                      ),
                                    })
                                  }
                                  className="h-11 text-right"
                                />
                              </FieldContent>
                            </Field>
                          </div>

                          <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                            <Typography.Text className="text-sm text-muted-foreground">
                              {t("total")}
                            </Typography.Text>
                            <Typography.Text className="font-mono font-semibold">
                              {formatCurrency(line.line_total)}
                            </Typography.Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>{t("notes")}</FieldLabel>
                <FieldContent>
                  <Textarea
                    rows={5}
                    placeholder={t("notesPlaceholder")}
                    {...form.register("notes")}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("termsAndConditions")}</FieldLabel>
                <FieldContent>
                  <Textarea
                    rows={5}
                    placeholder={t("termsPlaceholder")}
                    {...form.register("terms")}
                  />
                </FieldContent>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>{t("validUntil")}</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    className="h-11 max-w-xs"
                    {...form.register("valid_until")}
                  />
                </FieldContent>
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl border-border/60 shadow-sm xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle className="text-base">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="grid gap-3">
                  <Field>
                    <FieldLabel>{t("discountPercent")}</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(event) =>
                          setDiscountPercent(
                            Math.max(
                              0,
                              Math.min(100, Number(event.target.value) || 0),
                            ),
                          )
                        }
                        className="h-11 text-right"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("discountAmount")}</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min={0}
                        value={discountAmount}
                        onChange={(event) =>
                          setDiscountAmount(
                            Math.max(0, Number(event.target.value) || 0),
                          )
                        }
                        className="h-11 text-right"
                      />
                    </FieldContent>
                  </Field>

                  {/* НӨАТ Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex flex-col">
                      <Label className="text-xs font-medium">
                        {org?.locale === "en" ? "VAT" : "НӨАТ"}
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        {defaultTaxRate}%
                      </span>
                    </div>
                    <Switch
                      checked={nuatEnabled}
                      onCheckedChange={setNuatEnabled}
                    />
                  </div>

                  {/* Manual tax input - only when НӨАТ is disabled */}
                  {!nuatEnabled && (
                    <Field>
                      <FieldLabel>{t("tax")}</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min={0}
                          value={taxTotal}
                          onChange={(event) =>
                            setTaxTotal(
                              Math.max(0, Number(event.target.value) || 0),
                            )
                          }
                          className="h-11 text-right"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Typography.Text className="font-medium">
                  {t("grandTotal")}
                </Typography.Text>
                <Typography.Text className="font-mono text-xl font-semibold">
                  {formatCurrency(grandTotal)}
                </Typography.Text>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleSave("sent")}
                  disabled={savingState !== null || lines.length === 0}
                >
                  <Send className="size-4" />
                  {savingState === "sent"
                    ? t("creatingQuote")
                    : t("createQuote")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={savingState !== null || lines.length === 0}
                >
                  <Save className="size-4" />
                  {savingState === "draft" ? t("saving") : t("saveAsDraft")}
                </Button>
                <Button variant="ghost" onClick={() => router.back()}>
                  {t("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
