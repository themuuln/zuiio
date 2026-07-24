"use client";

import { useOrgMutation } from "@zuiio/query";
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
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useRouter } from "@/lib/i18n/navigation";
import { estimateKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { usePartSearch } from "@/lib/queries/use-part-search";
import { useServiceSearch } from "@/lib/queries/use-service-search";
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
  const t = useTranslations("estimates") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const locale = useLocale();
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";
  const selectedBranchId = useSelectedBranchId();
  const branchId = selectedBranchId === "all" ? null : selectedBranchId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
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

  const [partSearch, setPartSearch] = useState("");
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [partDrawerOpen, setPartDrawerOpen] = useState(false);
  const { data: services = [], isPending: searchingServices } =
    useServiceSearch(orgId, serviceSearch);
  const { data: parts = [], isPending: searchingParts } = usePartSearch(
    orgId,
    partSearch,
  );

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      notes: "",
      terms: "",
      valid_until: "",
    },
  });

  const createEstimate = useOrgMutation<
    { data: { id: string } },
    Record<string, unknown>
  >({
    endpoint: `/api/organizations/${orgId}/estimates`,
    method: "POST",
    queryKey: estimateKeys.all(orgId ?? ""),
    bodyFn: (vars) => vars,
    successMessage: t("quoteCreated"),
    onSuccess: (data) => {
      router.push(`/dashboard/estimates/${data.data.id}`);
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

    const values = form.getValues();
    await createEstimate.mutateAsync({
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
    });
  };

  return (
    <>
      <div className="px-4 pt-4 pb-6 md:px-6 mx-auto flex max-w-7xl flex-col gap-6 pb-8">
        <div className="flex flex-col gap-5 pb-2 xl:flex-row xl:items-start xl:justify-between">
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <section>
              <Typography.H2 className="mb-4 text-base font-medium">
                {t("customerInfo")}
              </Typography.H2>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Typography.H2 className="text-base font-medium">
                    {t("lineItems")}
                  </Typography.H2>
                  <Typography.Muted className="mt-1">
                    {t("noItemsDescription")}
                  </Typography.Muted>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setServiceDrawerOpen(true)}
                  >
                    <Plus className="size-4" />
                    {t("addService")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartDrawerOpen(true)}
                  >
                    <Plus className="size-4" />
                    {t("addPart")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={addCustomLine}>
                    <Plus className="size-4" />
                    {t("addCustom")}
                  </Button>
                </div>
              </div>

              {lines.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center">
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
                <div className="mt-4 flex flex-col">
                  {/* Header row */}
                  <div className="hidden gap-4 border-b border-border/60 px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))_80px]">
                    <span>{t("description")}</span>
                    <span className="text-right">{t("qty")}</span>
                    <span className="text-right">{t("unitPrice")}</span>
                    <span className="text-right">{t("discountPercent")}</span>
                    <span className="text-right">{t("discountAmount")}</span>
                    <span className="text-right">{t("total")}</span>
                  </div>

                  {lines.map((line, index) => {
                    const config = ITEM_TYPE_CONFIG[line.item_type];
                    const TypeIcon = config.icon;

                    return (
                      <div
                        key={line.id}
                        className="border-b border-border/30 py-4 last:border-b-0"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                {index + 1}
                              </div>
                              <Badge
                                variant={config.badge}
                                className="rounded-full px-2 py-0.5"
                              >
                                <TypeIcon className="size-3" />
                                {t(config.label)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs text-destructive"
                              onClick={() => removeLine(line.id)}
                            >
                              {commonT("delete")}
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))_80px] md:items-end">
                            <Field>
                              <FieldLabel className="md:sr-only">
                                {t("description")}
                              </FieldLabel>
                              <FieldContent>
                                <Input
                                  value={line.description}
                                  onChange={(event) =>
                                    updateLine(line.id, {
                                      description: event.target.value,
                                    })
                                  }
                                  placeholder={t("descriptionPlaceholder")}
                                  className="h-10"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel className="md:sr-only">
                                {t("qty")}
                              </FieldLabel>
                              <FieldContent>
                                <NumericInput
                                  min={1}
                                  value={line.quantity}
                                  onChange={(value) =>
                                    updateLine(line.id, {
                                      quantity: Math.max(1, value || 1),
                                    })
                                  }
                                  className="h-10 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel className="md:sr-only">
                                {t("unitPrice")}
                              </FieldLabel>
                              <FieldContent>
                                <CurrencyInput
                                  min={0}
                                  value={line.unit_price}
                                  onChange={(value) =>
                                    updateLine(line.id, {
                                      unit_price: Math.max(0, value || 0),
                                    })
                                  }
                                  className="h-10 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel className="md:sr-only">
                                {t("discountPercent")}
                              </FieldLabel>
                              <FieldContent>
                                <NumericInput
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  value={line.discount_percentage}
                                  onChange={(value) =>
                                    updateLine(line.id, {
                                      discount_percentage: Math.max(
                                        0,
                                        Math.min(100, value || 0),
                                      ),
                                    })
                                  }
                                  className="h-10 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel className="md:sr-only">
                                {t("discountAmount")}
                              </FieldLabel>
                              <FieldContent>
                                <CurrencyInput
                                  min={0}
                                  value={line.discount_amount}
                                  onChange={(value) =>
                                    updateLine(line.id, {
                                      discount_amount: Math.max(0, value || 0),
                                    })
                                  }
                                  className="h-10 text-right"
                                />
                              </FieldContent>
                            </Field>

                            <div className="flex items-end pb-1.5">
                              <Typography.Text className="w-full text-right font-mono text-sm font-semibold">
                                {formatCurrency(line.line_total)}
                              </Typography.Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <Typography.H2 className="mb-4 text-base font-medium">
                {t("notes")}
              </Typography.H2>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border/40 bg-muted/15 p-5 xl:sticky xl:top-6">
              <Typography.H2 className="mb-4 text-base font-medium">
                {t("summary")}
              </Typography.H2>
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span className="font-mono">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <Field>
                      <FieldLabel>{t("discountPercent")}</FieldLabel>
                      <FieldContent>
                        <NumericInput
                          min={0}
                          max={100}
                          step={0.1}
                          value={discountPercent}
                          onChange={(value) =>
                            setDiscountPercent(
                              Math.max(0, Math.min(100, value || 0)),
                            )
                          }
                          className="h-11 text-right"
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>{t("discountAmount")}</FieldLabel>
                      <FieldContent>
                        <CurrencyInput
                          min={0}
                          value={discountAmount}
                          onChange={(value) =>
                            setDiscountAmount(Math.max(0, value || 0))
                          }
                          className="h-11 text-right"
                        />
                      </FieldContent>
                    </Field>

                    {/* НӨАТ Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="flex flex-col">
                        <Label className="text-xs font-medium">
                          {locale === "en" ? "VAT" : "НӨАТ"}
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
                          <CurrencyInput
                            min={0}
                            value={taxTotal}
                            onChange={(value) =>
                              setTaxTotal(Math.max(0, value || 0))
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
                    disabled={createEstimate.isPending || lines.length === 0}
                  >
                    <Send className="size-4" />
                    {createEstimate.isPending
                      ? t("creatingQuote")
                      : t("createQuote")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSave("draft")}
                    disabled={createEstimate.isPending || lines.length === 0}
                  >
                    <Save className="size-4" />
                    {createEstimate.isPending ? t("saving") : t("saveAsDraft")}
                  </Button>
                  <Button variant="ghost" onClick={() => router.back()}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service picker popup */}
      <DetailDrawer
        open={serviceDrawerOpen}
        onOpenChange={setServiceDrawerOpen}
        size="lg"
        modal={false}
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>{t("addServiceTitle")}</DetailDrawer.Title>
          <DetailDrawer.Description>
            {t("searchServicesPlaceholder")}
          </DetailDrawer.Description>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <SearchInput
            placeholder={t("searchServicesPlaceholder")}
            onSearch={setServiceSearch}
            loading={searchingServices}
            debounceMs={400}
          />
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto mt-4">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => {
                  addServiceLine(service);
                  setServiceSearch("");
                  setServiceDrawerOpen(false);
                }}
              >
                <div>
                  <Typography.Text className="font-medium">
                    {service.name}
                  </Typography.Text>
                </div>
                <Typography.Text className="font-mono text-sm text-muted-foreground">
                  {formatCurrency(Number(service.default_price ?? 0))}
                </Typography.Text>
              </button>
            ))}
            {serviceSearch && services.length === 0 && !searchingServices ? (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                {commonT("noResults")}
              </div>
            ) : null}
          </div>
        </DetailDrawer.Body>
      </DetailDrawer>

      {/* Part picker popup */}
      <DetailDrawer
        open={partDrawerOpen}
        onOpenChange={setPartDrawerOpen}
        size="lg"
        modal={false}
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>{t("addPartTitle")}</DetailDrawer.Title>
          <DetailDrawer.Description>
            {t("searchPartsPlaceholder")}
          </DetailDrawer.Description>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <SearchInput
            placeholder={t("searchPartsPlaceholder")}
            onSearch={setPartSearch}
            loading={searchingParts}
            debounceMs={400}
          />
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto mt-4">
            {parts.map((part) => (
              <button
                key={part.id}
                type="button"
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => {
                  addPartLine(part);
                  setPartSearch("");
                  setPartDrawerOpen(false);
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
            {partSearch && parts.length === 0 && !searchingParts ? (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                {commonT("noResults")}
              </div>
            ) : null}
          </div>
        </DetailDrawer.Body>
      </DetailDrawer>
    </>
  );
}
