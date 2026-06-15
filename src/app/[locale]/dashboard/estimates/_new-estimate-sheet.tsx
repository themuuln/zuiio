"use client";

import {
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
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  nuatEnabled: z.boolean().optional(),
  taxTotal: z.number().min(0).optional(),
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

type NewEstimateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewEstimateSheet({
  open,
  onOpenChange,
}: NewEstimateSheetProps) {
  const t = useTranslations("estimates");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";
  const selectedBranchId = useSelectedBranchId();
  const branchId = selectedBranchId === "all" ? null : selectedBranchId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [savingState, setSavingState] = useState<"draft" | "sent" | null>(null);

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
      discountAmount: 0,
      discountPercent: 0,
      nuatEnabled: false,
      taxTotal: 0,
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
  const discountAmount = form.watch("discountAmount") ?? 0;
  const discountPercent = form.watch("discountPercent") ?? 0;
  const nuatEnabled = form.watch("nuatEnabled") ?? false;
  const taxTotal = form.watch("taxTotal") ?? 0;
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

    // Run Zod validation before proceeding
    const isValid = await form.trigger();
    if (!isValid) return;

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
      onOpenChange(false);
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToSave"));
    } finally {
      setSavingState(null);
    }
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="2xl">
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("newQuoteTitle")}</DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("pageDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <div className="flex flex-col gap-4">
          {/* Quick totals bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="font-mono font-semibold">
              {formatCurrency(subtotal)}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{t("discount")}</span>
            <span className="font-mono">
              {formatCurrency(quoteDiscountTotal)}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground font-medium">
              {t("grandTotal")}
            </span>
            <span className="font-mono text-base font-bold">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Customer & Vehicle */}
          <div className="grid gap-3 md:grid-cols-2">
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

          {/* Line Items */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Typography.Text className="text-sm font-medium">
                {t("lineItems")}
              </Typography.Text>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={addCustomLine}
                >
                  <Plus className="size-3.5" />
                  {t("addCustom")}
                </Button>
                <Drawer>
                  <DrawerTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                      />
                    }
                  >
                    <Plus className="size-3.5" />
                    {t("addService")}
                  </DrawerTrigger>
                  <DrawerContent className="sm:max-w-lg w-full">
                    <DrawerHeader>
                      <DrawerTitle>{t("addServiceTitle")}</DrawerTitle>
                      <DrawerDescription>
                        {t("searchServicesPlaceholder")}
                      </DrawerDescription>
                    </DrawerHeader>
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
                  </DrawerContent>
                </Drawer>
                <Drawer>
                  <DrawerTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                      />
                    }
                  >
                    <Plus className="size-3.5" />
                    {t("addPart")}
                  </DrawerTrigger>
                  <DrawerContent className="sm:max-w-lg w-full">
                    <DrawerHeader>
                      <DrawerTitle>{t("addPartTitle")}</DrawerTitle>
                      <DrawerDescription>
                        {t("searchPartsPlaceholder")}
                      </DrawerDescription>
                    </DrawerHeader>
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
                        {partSearch && parts.length === 0 && !searchingParts ? (
                          <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                            {commonT("noResults")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center">
                <Receipt className="size-5 text-muted-foreground" />
                <Typography.Text className="text-sm font-medium">
                  {t("noItemsTitle")}
                </Typography.Text>
                <Typography.Muted className="max-w-xs text-xs">
                  {t("noItemsDescription")}
                </Typography.Muted>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Header row */}
                <div className="hidden gap-2 border-b border-border/60 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1fr_60px_80px_60px_60px_60px]">
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
                      className="border-b border-border/20 py-2.5 last:border-b-0"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                              {index + 1}
                            </span>
                            <Badge
                              variant={config.badge}
                              className="rounded-full px-1.5 py-0 text-[10px]"
                            >
                              <TypeIcon className="size-2.5" />
                              {t(config.label)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-1.5 py-0.5 text-[10px] text-destructive"
                            onClick={() => removeLine(line.id)}
                          >
                            {commonT("delete")}
                          </Button>
                        </div>

                        <div className="grid gap-2 md:grid-cols-[1fr_60px_80px_60px_60px_60px] md:items-center">
                          <Input
                            value={line.description}
                            onChange={(event) =>
                              updateLine(line.id, {
                                description: event.target.value,
                              })
                            }
                            placeholder={t("descriptionPlaceholder")}
                            className="h-8 text-xs"
                          />
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
                            className="h-8 text-right text-xs"
                          />
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
                            className="h-8 text-right text-xs"
                          />
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
                            className="h-8 text-right text-xs"
                          />
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
                            className="h-8 text-right text-xs"
                          />
                          <div className="flex items-center justify-end">
                            <Typography.Text className="font-mono text-xs font-semibold">
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
          </div>

          {/* Notes & Terms inline */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Textarea
                rows={2}
                placeholder={t("notesPlaceholder")}
                className="min-h-0 resize-none text-xs"
                {...form.register("notes")}
              />
            </div>
            <div>
              <Textarea
                rows={2}
                placeholder={t("termsPlaceholder")}
                className="min-h-0 resize-none text-xs"
                {...form.register("terms")}
              />
            </div>
          </div>

          {/* Discount / Tax controls */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/15 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                {t("discountPercent")}
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(event) =>
                  form.setValue(
                    "discountPercent",
                    Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                  )
                }
                className="h-7 w-16 text-right text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                {t("discountAmount")}
              </Label>
              <Input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(event) =>
                  form.setValue(
                    "discountAmount",
                    Math.max(0, Number(event.target.value) || 0),
                  )
                }
                className="h-7 w-20 text-right text-xs"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {locale === "en" ? "VAT" : "НӨАТ"}
                </Label>
                <Switch
                  checked={nuatEnabled}
                  onCheckedChange={(checked) =>
                    form.setValue("nuatEnabled", checked)
                  }
                  className="scale-75"
                />
              </div>
              {!nuatEnabled && (
                <Input
                  type="number"
                  min={0}
                  value={taxTotal}
                  onChange={(event) =>
                    form.setValue(
                      "taxTotal",
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  className="h-7 w-20 text-right text-xs"
                  placeholder={t("tax")}
                />
              )}
            </div>
          </div>
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer className="flex flex-row items-center gap-2">
        <Button
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={savingState !== null || lines.length === 0}
          className="flex-1"
        >
          <Save className="size-4" />
          {savingState === "draft" ? t("saving") : t("saveAsDraft")}
        </Button>
        <Button
          onClick={() => handleSave("sent")}
          disabled={savingState !== null || lines.length === 0}
          className="flex-1"
        >
          <Send className="size-4" />
          {savingState === "sent" ? t("creatingQuote") : t("createQuote")}
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
