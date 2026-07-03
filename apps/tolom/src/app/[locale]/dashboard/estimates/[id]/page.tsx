"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Pencil,
  Send,
  SquareArrowOutUpRight,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/lib/i18n/navigation";
import { estimateKeys } from "@/lib/queries/keys";
import {
  useConvertEstimate,
  useEstimateDetail,
  useUpdateEstimateStatus,
} from "@/lib/queries/use-estimates";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { EstimateDetail, EstimateItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface EditableLine {
  id: string;
  item_type: "service" | "part" | "custom";
  source_service_id?: string | null;
  source_part_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-foreground",
  sent: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  declined:
    "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
  expired:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  converted:
    "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
};

const ITEM_STYLES: Record<
  EditableLine["item_type"],
  "default" | "secondary" | "outline"
> = {
  service: "default",
  part: "secondary",
  custom: "outline",
};

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

function itemsToEditableLines(items: EstimateItem[]): EditableLine[] {
  return items.map((item) => ({
    id: item.id,
    item_type: item.item_type as EditableLine["item_type"],
    source_service_id: item.source_service_id ?? null,
    source_part_id: item.source_part_id ?? null,
    description: item.description,
    quantity: Number(item.quantity ?? 1),
    unit_price: Number(item.unit_price ?? 0),
    discount_amount: Number(item.discount_amount ?? 0),
    discount_percentage: Number(item.discount_percentage ?? 0),
    line_total: Number(item.line_total ?? 0),
  }));
}

function getCustomerName(estimate: EstimateDetail) {
  return (
    [estimate.customer?.first_name, estimate.customer?.last_name]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

export default function EstimateDetailPage() {
  const t = useTranslations("estimates");
  const commonT = useTranslations("common");
  const params = useParams();
  const estimateId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const estimateQuery = useEstimateDetail(orgId, estimateId);
  const estimate = estimateQuery.data;
  const updateStatus = useUpdateEstimateStatus(orgId);
  const convertEstimate = useConvertEstimate(orgId);

  const [isEditing, setIsEditing] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [sending, setSending] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [editLines, setEditLines] = useState<EditableLine[]>([]);
  const [editDiscountAmount, setEditDiscountAmount] = useState(0);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editTaxTotal, setEditTaxTotal] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");

  useEffect(() => {
    if (!estimate || isEditing) return;
    setEditLines(itemsToEditableLines(estimate.items ?? []));
    setEditDiscountAmount(Number(estimate.discount_amount ?? 0));
    setEditDiscountPercent(Number(estimate.discount_percentage ?? 0));
    setEditTaxTotal(Number(estimate.tax_total ?? 0));
    setEditNotes(estimate.notes ?? "");
    setEditTerms(estimate.terms ?? "");
    setEditValidUntil(estimate.valid_until?.slice(0, 10) ?? "");
  }, [estimate, isEditing]);

  useEffect(() => {
    if (convertEstimate.data?.id) {
      router.push(`/dashboard/work-orders/${convertEstimate.data.id}`);
    }
  }, [convertEstimate.data?.id, router]);

  const editSubtotal = useMemo(
    () => editLines.reduce((sum, line) => sum + line.line_total, 0),
    [editLines],
  );
  const editDiscountTotal =
    editDiscountAmount + editSubtotal * (editDiscountPercent / 100);
  const editGrandTotal = Math.max(
    editSubtotal - editDiscountTotal + editTaxTotal,
    0,
  );

  const beginEditing = () => {
    if (!estimate) return;
    setEditLines(itemsToEditableLines(estimate.items ?? []));
    setEditDiscountAmount(Number(estimate.discount_amount ?? 0));
    setEditDiscountPercent(Number(estimate.discount_percentage ?? 0));
    setEditTaxTotal(Number(estimate.tax_total ?? 0));
    setEditNotes(estimate.notes ?? "");
    setEditTerms(estimate.terms ?? "");
    setEditValidUntil(estimate.valid_until?.slice(0, 10) ?? "");
    setIsEditing(true);
  };

  const updateLine = (id: string, patch: Partial<EditableLine>) => {
    setEditLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...patch };
        next.line_total = calculateLineTotal(next);
        return next;
      }),
    );
  };

  const removeLine = (id: string) => {
    setEditLines((current) => current.filter((line) => line.id !== id));
  };

  const refreshEstimate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(orgId ?? "", estimateId),
      }),
      queryClient.invalidateQueries({
        queryKey: estimateKeys.all(orgId ?? ""),
      }),
    ]);
    await estimateQuery.refetch();
  };

  const saveEdits = async () => {
    if (!orgId) return;
    if (editLines.length === 0) {
      toast.error(t("addAtLeastOneItem"));
      return;
    }
    if (editLines.some((line) => !line.description.trim())) {
      toast.error(t("description"));
      return;
    }

    setSavingEdits(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valid_until: editValidUntil || null,
            notes: editNotes.trim() || null,
            terms: editTerms.trim() || null,
            discount_amount: editDiscountAmount,
            discount_percentage: editDiscountPercent,
            tax_total: editTaxTotal,
            items: editLines.map((line, index) => ({
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
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setIsEditing(false);
      toast.success(t("saved"));
      await refreshEstimate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToSave"));
    } finally {
      setSavingEdits(false);
    }
  };

  const duplicateEstimate = async () => {
    if (!orgId || !estimate) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: estimate.customer_id,
          vehicle_id: estimate.vehicle_id,
          branchId: estimate.branch_id,
          status: "draft",
          valid_until: estimate.valid_until,
          notes: estimate.notes ?? undefined,
          terms: estimate.terms ?? undefined,
          discount_amount: Number(estimate.discount_amount ?? 0),
          discount_percentage: Number(estimate.discount_percentage ?? 0),
          tax_total: Number(estimate.tax_total ?? 0),
          items: (estimate.items ?? []).map((item, index) => ({
            item_type: item.item_type,
            source_service_id: item.source_service_id ?? null,
            source_part_id: item.source_part_id ?? null,
            description: item.description,
            quantity: Number(item.quantity ?? 1),
            unit_price: Number(item.unit_price ?? 0),
            discount_amount: Number(item.discount_amount ?? 0),
            discount_percentage: Number(item.discount_percentage ?? 0),
            sort_order: index,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success(t("estimateDuplicated"));
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failedToDuplicate"),
      );
    } finally {
      setDuplicating(false);
    }
  };

  const sendEstimate = async () => {
    if (!orgId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}/send`,
        {
          method: "POST",
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success(t("estimateSent"));
      await refreshEstimate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToSend"));
    } finally {
      setSending(false);
    }
  };

  const copyPublicLink = async () => {
    if (!estimate?.public_token) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/estimate/${estimate.public_token}`,
      );
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("failedToSave"));
    }
  };

  if (estimateQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[520px] rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-8">
        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardContent className="py-12 text-center">
            <Typography.H3>{t("notFound")}</Typography.H3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = ["draft", "sent"].includes(estimate.status);
  const displayLines = isEditing
    ? editLines
    : itemsToEditableLines(estimate.items ?? []);
  const displaySubtotal = isEditing
    ? editSubtotal
    : Number(estimate.subtotal ?? 0);
  const displayDiscount = isEditing
    ? editDiscountTotal
    : Number(estimate.discount_total ?? 0);
  const displayTax = isEditing ? editTaxTotal : Number(estimate.tax_total ?? 0);
  const displayGrandTotal = isEditing
    ? editGrandTotal
    : Number(estimate.grand_total ?? 0);

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
              <Badge
                variant="secondary"
                className={
                  STATUS_STYLES[estimate.status] ?? STATUS_STYLES.draft
                }
              >
                {t(`status_${estimate.status}`)}
              </Badge>
              {estimate.valid_until && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  {t("validUntil")}:{" "}
                  {new Date(estimate.valid_until).toLocaleDateString()}
                </Badge>
              )}
              {estimate.converted_work_order && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  <CheckCircle2 className="size-3.5" />
                  {t("convertedToWorkOrder")}
                </Badge>
              )}
            </div>

            <div>
              <Typography.H1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {estimate.estimate_number}
              </Typography.H1>
              <Typography.Muted className="mt-1 text-sm">
                {t("created")}{" "}
                {new Date(estimate.created_at).toLocaleDateString()}
                {getCustomerName(estimate) !== "—"
                  ? ` · ${getCustomerName(estimate)}`
                  : ""}
              </Typography.Muted>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
            {canEdit && !isEditing ? (
              <Button variant="outline" onClick={beginEditing}>
                <Pencil className="size-4" />
                {t("edit")}
              </Button>
            ) : null}
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={saveEdits} disabled={savingEdits}>
                  {savingEdits ? t("saving") : t("saveChanges")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={duplicateEstimate}
                  disabled={duplicating}
                >
                  <Copy className="size-4" />
                  {t("duplicate")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `/api/organizations/${orgId}/estimates/${estimateId}/pdf`,
                      "_blank",
                    )
                  }
                >
                  <Download className="size-4" />
                  {t("downloadPdf")}
                </Button>
                {estimate.public_token ? (
                  <Button variant="outline" onClick={copyPublicLink}>
                    <Copy className="size-4" />
                    {t("share")}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{t("customer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Typography.Text className="font-medium">
                  {getCustomerName(estimate)}
                </Typography.Text>
                {estimate.customer?.phone ? (
                  <Typography.Muted>{estimate.customer.phone}</Typography.Muted>
                ) : null}
                {estimate.customer?.email ? (
                  <Typography.Muted>{estimate.customer.email}</Typography.Muted>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{t("vehicle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Typography.Text className="font-medium font-mono">
                  {estimate.vehicle?.plate_number ?? "—"}
                </Typography.Text>
                <Typography.Muted>
                  {[
                    estimate.vehicle?.year,
                    estimate.vehicle?.make,
                    estimate.vehicle?.model,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </Typography.Muted>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("lineItems")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {displayLines.map((line, index) => (
                <div
                  key={line.id}
                  className="rounded-2xl border border-border/60 bg-card p-4"
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={ITEM_STYLES[line.item_type]}>
                          {t(line.item_type)}
                        </Badge>
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
                              className="h-11"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>{t("qty")}</FieldLabel>
                          <FieldContent>
                            <NumericInput
                              min={1}
                              value={line.quantity}
                              onChange={(value) =>
                                updateLine(line.id, {
                                  quantity: Math.max(1, value || 1),
                                })
                              }
                              className="h-11 text-right"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>{t("unitPrice")}</FieldLabel>
                          <FieldContent>
                            <CurrencyInput
                              min={0}
                              value={line.unit_price}
                              onChange={(value) =>
                                updateLine(line.id, {
                                  unit_price: Math.max(0, value || 0),
                                })
                              }
                              className="h-11 text-right"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>{t("discountPercent")}</FieldLabel>
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
                              className="h-11 text-right"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>{t("discountAmount")}</FieldLabel>
                          <FieldContent>
                            <CurrencyInput
                              min={0}
                              value={line.discount_amount}
                              onChange={(value) =>
                                updateLine(line.id, {
                                  discount_amount: Math.max(0, value || 0),
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
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </div>
                          <Badge variant={ITEM_STYLES[line.item_type]}>
                            {t(line.item_type)}
                          </Badge>
                        </div>
                        <Typography.Text className="font-medium">
                          {line.description}
                        </Typography.Text>
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                          <span>
                            {t("qty")}: {line.quantity}
                          </span>
                          <span>
                            {t("unitPrice")}: {formatCurrency(line.unit_price)}
                          </span>
                          <span>
                            {t("discount")}:{" "}
                            {line.discount_amount > 0
                              ? formatCurrency(line.discount_amount)
                              : line.discount_percentage > 0
                                ? `${line.discount_percentage}%`
                                : "—"}
                          </span>
                        </div>
                      </div>
                      <Typography.Text className="font-mono text-lg font-semibold">
                        {formatCurrency(line.line_total)}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              ))}

              {displayLines.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">
                  {t("noItems")}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("quoteDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>{t("validUntil")}</FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editValidUntil}
                      onChange={(event) =>
                        setEditValidUntil(event.target.value)
                      }
                      className="h-11"
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 px-3 py-2 text-sm">
                      {estimate.valid_until
                        ? new Date(estimate.valid_until).toLocaleDateString()
                        : "—"}
                    </div>
                  )}
                </FieldContent>
              </Field>

              <div className="hidden md:block" />

              <Field>
                <FieldLabel>{t("notes")}</FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Textarea
                      rows={5}
                      value={editNotes}
                      onChange={(event) => setEditNotes(event.target.value)}
                      placeholder={t("notesPlaceholder")}
                    />
                  ) : (
                    <div className="min-h-28 rounded-xl border border-border/60 px-3 py-2 text-sm">
                      {estimate.notes || "—"}
                    </div>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("terms")}</FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Textarea
                      rows={5}
                      value={editTerms}
                      onChange={(event) => setEditTerms(event.target.value)}
                      placeholder={t("termsPlaceholder")}
                    />
                  ) : (
                    <div className="min-h-28 rounded-xl border border-border/60 px-3 py-2 text-sm">
                      {estimate.terms || "—"}
                    </div>
                  )}
                </FieldContent>
              </Field>
            </CardContent>
          </Card>

          {estimate.converted_work_order ? (
            <Card className="rounded-3xl border-green-200 bg-green-50/40 shadow-sm dark:border-green-900/40 dark:bg-green-950/10">
              <CardContent className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-green-600" />
                  <div>
                    <Typography.Text className="font-medium">
                      {t("convertedToWorkOrder")}
                    </Typography.Text>
                    <Typography.Muted>
                      {estimate.converted_work_order.id}
                    </Typography.Muted>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/work-orders/${estimate.converted_work_order?.id}`,
                    )
                  }
                >
                  <SquareArrowOutUpRight className="size-4" />
                  {t("viewWorkOrder")}
                </Button>
              </CardContent>
            </Card>
          ) : null}
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
                  <span className="font-mono">
                    {formatCurrency(displaySubtotal)}
                  </span>
                </div>
                {isEditing ? (
                  <>
                    <Field>
                      <FieldLabel>{t("discountPercent")}</FieldLabel>
                      <FieldContent>
                        <NumericInput
                          min={0}
                          max={100}
                          step={0.1}
                          value={editDiscountPercent}
                          onChange={(value) =>
                            setEditDiscountPercent(
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
                          value={editDiscountAmount}
                          onChange={(value) =>
                            setEditDiscountAmount(
                              Math.max(0, value || 0),
                            )
                          }
                          className="h-11 text-right"
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>{t("tax")}</FieldLabel>
                      <FieldContent>
                        <CurrencyInput
                          min={0}
                          value={editTaxTotal}
                          onChange={(value) =>
                            setEditTaxTotal(
                              Math.max(0, value || 0),
                            )
                          }
                          className="h-11 text-right"
                        />
                      </FieldContent>
                    </Field>
                  </>
                ) : (
                  <>
                    {displayDiscount > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("discount")}
                        </span>
                        <span className="font-mono text-destructive">
                          -{formatCurrency(displayDiscount)}
                        </span>
                      </div>
                    ) : null}
                    {displayTax > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("tax")}
                        </span>
                        <span className="font-mono">
                          {formatCurrency(displayTax)}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Typography.Text className="font-medium">
                  {t("grandTotal")}
                </Typography.Text>
                <Typography.Text className="font-mono text-xl font-semibold">
                  {formatCurrency(displayGrandTotal)}
                </Typography.Text>
              </div>

              {!isEditing ? (
                <div className="flex flex-col gap-2">
                  {estimate.status === "draft" ? (
                    <>
                      <Button onClick={sendEstimate} disabled={sending}>
                        <Send className="size-4" />
                        {sending ? t("sending") : t("sendToCustomer")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateStatus.mutate({
                            estimateId,
                            status: "approved",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="size-4" />
                        {t("approve")}
                      </Button>
                    </>
                  ) : null}

                  {estimate.status === "sent" ? (
                    <>
                      <Button
                        onClick={() =>
                          updateStatus.mutate({
                            estimateId,
                            status: "approved",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="size-4" />
                        {t("approve")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateStatus.mutate({
                            estimateId,
                            status: "declined",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="size-4" />
                        {t("decline")}
                      </Button>
                    </>
                  ) : null}

                  {estimate.status === "approved" ? (
                    <>
                      <Dialog>
                        <DialogTrigger render={<Button />}>
                          <ArrowRight className="size-4" />
                          {t("convertToWorkOrder")}
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("convertToWorkOrder")}</DialogTitle>
                            <DialogDescription>
                              {t("convertDescription")}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              {t("customerInfo")}: {getCustomerName(estimate)}
                            </p>
                            <p>
                              {t("vehicleInfo")}:{" "}
                              {estimate.vehicle?.plate_number ?? "—"}
                            </p>
                            <p>
                              {t("items")}: {estimate.items.length}
                            </p>
                            <p>
                              {t("grandTotal")}:{" "}
                              {formatCurrency(displayGrandTotal)}
                            </p>
                          </div>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline" />}>
                              {t("cancel")}
                            </DialogClose>
                            <Button
                              onClick={() =>
                                convertEstimate.mutate({ estimateId })
                              }
                              disabled={convertEstimate.isPending}
                            >
                              {convertEstimate.isPending
                                ? t("converting")
                                : t("createWorkOrder")}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateStatus.mutate({
                            estimateId,
                            status: "declined",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="size-4" />
                        {t("decline")}
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
