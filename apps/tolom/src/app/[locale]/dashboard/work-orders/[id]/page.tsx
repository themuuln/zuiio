"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { ExportButton } from "@/components/export-button";
import { RefundDialog } from "@/components/invoices/_refund-dialog";
import { RefundReceipt } from "@/components/invoices/_refund-receipt";
import { MechanicSelect } from "@/components/mechanic-select";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import WorkOrderPhotoUpload from "@/components/work-order-photo-upload";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import type { WorkOrderAttachment, WorkOrderStatus } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";
import { useWorkOrderDetailPage } from "./_use-work-order-detail-page";

export type ReturnTypeOfUseWorkOrderDetail = ReturnType<
  typeof useWorkOrderDetailPage
>;

export default function WorkOrderDetailPage() {
  const ctx = useWorkOrderDetailPage();
  const t = useTranslations("workOrderDetail");

  // paymentForm is UI state, not data-layer — keep it here
  const paymentSchema = z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    method: z.string().min(1, "Payment method is required"),
    reference: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  });
  type PaymentFormValues = z.infer<typeof paymentSchema>;
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, method: "cash", reference: "", notes: "" },
  });

  // ── Destructure hook values ──
  const {
    woId,
    wo,
    catalog,
    partsCatalog,
    mechanics,
    payments,
    attachments,
    storeCreditBalance,
    existingInvoiceId,
    invoicePaymentsData,
    servicesTotal,
    partsTotal,
    totalPaid,
    balanceDue,
    invoiceStatus,
    invoiceRefunds,
    totalRefunded,
    maxRefundable,
    servicesCost,
    partsCost,
    totalCost,
    grossProfit,
    marginPercent,
    serviceSearch,
    showAddService,
    deleteConfirm,
    newPart,
    showAddPart,
    confirmStatus,
    statusNotes,
    lossReasonText,
    showPaymentDialog,
    showRefundDialog,
    receiptRefund,
    showRepeatDialog,
    saving,
    loading,
    error,
    setServiceSearch,
    setShowAddService,
    setDeleteConfirm,
    setNewPart,
    setShowAddPart,
    setConfirmStatus,
    setStatusNotes,
    setLossReasonText,
    setShowPaymentDialog,
    setShowRefundDialog,
    setReceiptRefund,
    setShowRepeatDialog,
    handleChangeStatus,
    handleAssignMechanic,
    handleAddService,
    handleAddPart,
    handleRemoveLine,
    handleRepeatFromLastVisit,
    handleGenerateInvoice,
    handlePaymentSubmit,
    refetchWo,
    back,
    orgId,
    orgName,
    serviceExportColumns,
    partExportColumns,

    createInvoice,
    recordPayment,
    invoicePaymentsData: _,
    invoiceRefundsData: __,
    partPriceHistoryData: ___,
  } = ctx;

  if (loading) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="flex p-6 flex-col gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !wo) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <Button variant="ghost" onClick={() => back()} className="w-fit">
          <ArrowLeft className="size-4" /> {t("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Typography.Muted className="text-muted-foreground">
              {error ?? t("workOrderNotFound")}
            </Typography.Muted>
            <Button onClick={() => refetchWo()} variant="outline">
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="tablet-touch flex max-w-5xl flex-col gap-6 tablet:gap-6 tablet:px-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 tablet:gap-6">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => back()}
          aria-label={t("back")}
          className="tablet:size-12"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("woPrefix")}
              {wo.id.slice(0, 8)}
            </Typography.H1>
            <StatusBadge status={wo.status as unknown as WorkOrderStatus} />
          </div>
          <Typography.Muted className="text-sm text-muted-foreground">
            {new Date(wo.created_at).toLocaleDateString()}
            {wo.customer &&
              ` \u00B7 ${wo.customer.first_name} ${wo.customer.last_name ?? ""}`}
            {wo.vehicle && ` \u00B7 ${wo.vehicle.plate_number}`}
          </Typography.Muted>
        </div>
      </div>

      {/* ── Status Change ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("status")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[
              "New",
              "Diagnosing",
              "In Progress",
              "Ready for Pickup",
              "Completed",
              "Cancelled",
            ].map((s) => (
              <Button
                key={s}
                variant={wo.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => handleChangeStatus(s)}
                disabled={saving || wo.status === s}
                className="min-h-[var(--ui-touch-target)]"
              >
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Status Change Confirmation ── */}
      {confirmStatus && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                <div>
                  <Typography.Text className="font-medium text-sm">
                    {t("changeStatusTo", { status: confirmStatus })}
                  </Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground mt-1">
                    {confirmStatus === "Completed"
                      ? t("markComplete")
                      : t("markCancelled")}
                  </Typography.Muted>
                </div>
              </div>
              <Input
                placeholder={t("addNotesOptional")}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="h-11"
              />
              {grossProfit < 0 &&
                (confirmStatus === "Completed" ||
                  confirmStatus === "Cancelled") && (
                  <div className="flex flex-col gap-1.5">
                    <Typography.Text className="text-sm font-medium text-destructive">
                      {t("lossReasonRequired")}
                    </Typography.Text>
                    <Textarea
                      placeholder={t("lossReasonPlaceholder")}
                      value={lossReasonText}
                      onChange={(e) => setLossReasonText(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmStatus(null);
                    setStatusNotes("");
                    setLossReasonText("");
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant={
                    confirmStatus === "Cancelled" ? "destructive" : "default"
                  }
                  disabled={
                    saving ||
                    (grossProfit < 0 &&
                      !lossReasonText.trim() &&
                      (confirmStatus === "Completed" ||
                        confirmStatus === "Cancelled"))
                  }
                  onClick={() =>
                    handleChangeStatus(confirmStatus, lossReasonText)
                  }
                >
                  {saving
                    ? t("updating")
                    : t("confirm", { status: confirmStatus })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Customer & Vehicle ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("customerAndVehicle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {wo.customer && (
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <Typography.Text className="text-sm font-medium">
                  {wo.customer.first_name} {wo.customer.last_name ?? ""}
                </Typography.Text>
                <Typography.Muted className="text-xs text-muted-foreground">
                  {wo.customer.phone || wo.customer.email || "\u2014"}
                </Typography.Muted>
              </div>
            </div>
          )}
          {wo.vehicle && (
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <Typography.Text className="text-sm font-medium">
                  {wo.vehicle.plate_number}
                </Typography.Text>
                <Typography.Muted className="text-xs text-muted-foreground">
                  {[wo.vehicle.make, wo.vehicle.model, wo.vehicle.year]
                    .filter(Boolean)
                    .join(" ") || "\u2014"}
                </Typography.Muted>
              </div>
            </div>
          )}
          {!wo.customer && !wo.vehicle && (
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("noCustomerOrVehicle")}
            </Typography.Muted>
          )}
          {(wo.complaint || wo.diagnosis_label) && (
            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
              {wo.complaint && (
                <div>
                  <Typography.Muted className="text-xs font-medium text-muted-foreground mb-0.5">
                    {t("complaint")}
                  </Typography.Muted>
                  <Typography.Text className="text-sm">
                    {wo.complaint}
                  </Typography.Text>
                </div>
              )}
              {wo.diagnosis_label && (
                <div className="flex items-center gap-2">
                  <Typography.Muted className="text-xs font-medium text-muted-foreground">
                    {t("diagnosis")}
                  </Typography.Muted>
                  <Badge
                    variant="outline"
                    className="gap-1.5"
                    style={{
                      backgroundColor: wo.diagnosis_label.color
                        ? `${wo.diagnosis_label.color}20`
                        : undefined,
                      color: wo.diagnosis_label.color ?? undefined,
                    }}
                  >
                    {wo.diagnosis_label.color && (
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: wo.diagnosis_label.color }}
                      />
                    )}
                    {wo.diagnosis_label.name_mn ?? wo.diagnosis_label.name}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Mechanic Assignment ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("mechanic")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MechanicSelect
            value={wo.mechanic_id ?? ""}
            onChange={handleAssignMechanic}
            mechanics={mechanics}
            disabled={saving}
            showJobCount
          />
        </CardContent>
      </Card>

      {/* ── Services ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("services")}</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton
              data={wo.services ?? []}
              columns={serviceExportColumns}
              filename={`wo-${woId.slice(0, 8)}-services.xlsx`}
              sheetName="Services"
              label={t("exportServices")}
            />
            {/* Repeat from last visit is on line 3 — keeping it under services button group */}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Repeat from Last Visit */}
          <div className="flex gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRepeatDialog(true)}
              disabled={
                !ctx.lastVisit ||
                (ctx.lastVisit.services.length === 0 &&
                  ctx.lastVisit.parts.length === 0)
              }
            >
              {t("repeatFromLastVisit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddService(!showAddService)}
            >
              <Plus className="size-4" /> {t("add")}
            </Button>
          </div>
          {showAddService && (
            <div className="flex flex-col gap-2 mb-2">
              <Input
                placeholder={t("searchPlaceholder")}
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="h-11"
              />
              {serviceSearch.trim() && (
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border rounded-lg">
                  {catalog.flatMap((s) =>
                    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
                      ? [
                          <Button
                            key={s.id}
                            onClick={() => {
                              handleAddService(s);
                              setShowAddService(false);
                              setServiceSearch("");
                            }}
                            variant="ghost"
                            className="w-full justify-between px-3 py-3"
                          >
                            <span className="text-sm font-medium">
                              {s.name}
                            </span>
                            <span className="text-sm tabular-nums">
                              {formatMNT(s.default_price ?? 0)}
                            </span>
                          </Button>,
                        ]
                      : [],
                  )}
                </div>
              )}
            </div>
          )}
          {(wo.services ?? []).length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("noServicesAdded")}
            </Typography.Muted>
          ) : (
            (wo.services ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <Typography.Text className="text-sm font-medium truncate">
                    {s.service_name}
                  </Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {s.quantity} x {formatMNT(Number(s.unit_price))}
                    {Number(s.discount_amount) > 0 &&
                      ` (-${formatMNT(Number(s.discount_amount))})`}
                  </Typography.Muted>
                  {s.last_sold_price && (
                    <Typography.Text className="text-xs text-amber-600">
                      {t("lastSoldShort", {
                        price: formatMNT(Number(s.last_sold_price)),
                      })}
                    </Typography.Text>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium tabular-nums">
                    {formatMNT(Number(s.final_price))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-11 text-destructive"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "service",
                        id: s.id,
                        name: s.service_name,
                      })
                    }
                    aria-label={t("removeServiceAria")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Parts ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("parts")}</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton
              data={wo.parts ?? []}
              columns={partExportColumns}
              filename={`wo-${woId.slice(0, 8)}-parts.xlsx`}
              sheetName="Parts"
              label={t("exportParts")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPart(!showAddPart)}
            >
              <Plus className="size-4" /> {t("add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showAddPart && (
            <div className="flex flex-col mb-2">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[160px] relative">
                  <Input
                    placeholder={t("partName")}
                    value={newPart.part_name}
                    onChange={(e) =>
                      setNewPart((p) => ({ ...p, part_name: e.target.value }))
                    }
                    className="h-11"
                  />
                  {newPart.part_name.trim() && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
                      {partsCatalog
                        .filter(
                          (p) =>
                            p.name
                              .toLowerCase()
                              .includes(newPart.part_name.toLowerCase()) ||
                            p.part_number
                              ?.toLowerCase()
                              .includes(newPart.part_name.toLowerCase()),
                        )
                        .slice(0, 10)
                        .map((part) => (
                          <Button
                            key={part.id}
                            onClick={() =>
                              setNewPart({
                                part_name: part.name,
                                quantity: 1,
                                unit_price: part.default_price ?? 0,
                              })
                            }
                            variant="ghost"
                            className="w-full justify-between px-3 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium">
                                {part.name}
                              </span>
                              {part.part_number && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  #{part.part_number}
                                </span>
                              )}
                            </div>
                            <span className="text-sm tabular-nums shrink-0 ml-2">
                              {formatMNT(part.default_price ?? 0)}
                            </span>
                          </Button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="w-20">
                  <NumericInput
                    value={newPart.quantity}
                    onChange={(qty) =>
                      setNewPart((p) => ({
                        ...p,
                        quantity: Math.max(1, Math.round(qty)),
                      }))
                    }
                    size="lg"
                    align="center"
                    className="w-14"
                    aria-label={t("qty")}
                    min={1}
                  />
                </div>
                <div className="w-28">
                  <CurrencyInput
                    value={newPart.unit_price}
                    onChange={(price) =>
                      setNewPart((p) => ({
                        ...p,
                        unit_price: price,
                      }))
                    }
                    size="lg"
                    showPrefix={false}
                    aria-label={t("unitPrice")}
                  />
                  {ctx.partPriceHistoryData &&
                    ctx.partPriceHistoryData.length > 0 && (
                      <Typography.Text className="mt-1 text-[11px] text-amber-600">
                        {t("lastPrices", {
                          prices: ctx.partPriceHistoryData
                            .map((price) => formatMNT(price))
                            .join(" | "),
                        })}
                      </Typography.Text>
                    )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddPart}
                  disabled={!newPart.part_name.trim()}
                >
                  {t("add")}
                </Button>
              </div>
            </div>
          )}
          {(wo.parts ?? []).length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("noPartsAdded")}
            </Typography.Muted>
          ) : (
            (wo.parts ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <Typography.Text className="text-sm font-medium">
                    {p.part_name}
                  </Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {p.quantity} x {formatMNT(Number(p.unit_price))}
                  </Typography.Muted>
                  {p.last_sold_price && (
                    <Typography.Text className="text-xs text-amber-600">
                      {t("lastSoldShort", {
                        price: formatMNT(Number(p.last_sold_price)),
                      })}
                    </Typography.Text>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatMNT(Number(p.final_price))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-11 text-destructive"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "part",
                        id: p.id,
                        name: p.part_name,
                      })
                    }
                    aria-label={t("removePartAria")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <Typography.Text className="font-medium text-sm">
                    {t("removeConfirm", { item: deleteConfirm.type })}
                  </Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground mt-1">
                    <strong>{deleteConfirm.name}</strong> will be removed from
                    this work order.
                  </Typography.Muted>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {t("keep")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirm(null);
                    handleRemoveLine(deleteConfirm.type, deleteConfirm.id);
                  }}
                >
                  {t("remove")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Status History ── */}
      {wo.status_history && wo.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("statusHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {wo.status_history.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-2.5 rounded-full",
                        i === 0 ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                    />
                    {i < (wo.status_history?.length ?? 0) - 1 && (
                      <div className="w-px h-4 bg-border" />
                    )}
                  </div>
                  <div>
                    <StatusBadge
                      status={h.status as unknown as WorkOrderStatus}
                    />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                    {h.notes && (
                      <Typography.Muted className="text-xs text-muted-foreground mt-0.5">
                        {h.notes}
                      </Typography.Muted>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Photos & Documents ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4" />
            {t("photos")}
          </CardTitle>
          <WorkOrderPhotoUpload orgId={orgId!} workOrderId={woId} />
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("noPhotos")}
            </Typography.Muted>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {attachments.map((att: WorkOrderAttachment) => (
                <div
                  key={att.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {att.file_type === "photo" ? (
                    <a
                      href={att.public_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-full"
                    >
                      <img
                        src={att.public_url ?? ""}
                        alt={att.file_name}
                        className="size-full object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={att.public_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-full flex-col items-center justify-center gap-1 p-2"
                    >
                      <FileText className="size-8 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                        {att.file_name}
                      </span>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      if (confirm(t("removePhotoConfirm")))
                        ctx.deleteAttachment.mutate(att.id);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-background/80 text-muted-foreground opacity-0 hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                    aria-label={t("removePhoto")}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invoice Generation ── */}
      {(wo.status === "Completed" || wo.status === "Ready for Pickup") && (
        <Card className="border-green-200/50 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-green-600" />
                <div>
                  <Typography.Text className="font-medium text-sm">
                    {t("invoiceReady")}
                  </Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground mt-0.5">
                    {existingInvoiceId
                      ? t("invoiceReadyDesc")
                      : t("generateInvoiceDesc")}
                  </Typography.Muted>
                </div>
              </div>
              <Button
                size="default"
                onClick={handleGenerateInvoice}
                disabled={createInvoice.isPending}
                className="shrink-0"
              >
                <FileText className="size-4" />
                {createInvoice.isPending
                  ? t("generating")
                  : existingInvoiceId
                    ? t("viewInvoice")
                    : t("generateInvoice")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Payment ── */}
      {existingInvoiceId && (
        <Card className="border-green-200/50 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="flex p-4 flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-green-600" />
                <Typography.Text className="font-medium text-sm">
                  {t("paymentStatus")}
                </Typography.Text>
              </div>
              <Badge
                variant={
                  invoiceStatus === "paid"
                    ? "default"
                    : invoiceStatus === "partial"
                      ? "secondary"
                      : "outline"
                }
              >
                {invoiceStatus || "pending"}
              </Badge>
            </div>
            {payments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {payments.map(
                  (p: {
                    id: string;
                    method: string;
                    paid_at: string;
                    amount: number;
                    reference?: string | null;
                  }) => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {p.method} · {new Date(p.paid_at).toLocaleDateString()}
                        {p.reference ? ` (${p.reference})` : ""}
                      </span>
                      <span className="font-medium">{formatMNT(p.amount)}</span>
                    </div>
                  ),
                )}
              </div>
            )}
            <div className="flex justify-between text-sm border-t pt-2">
              <span>{t("totalPaid")}</span>
              <span className="font-medium">{formatMNT(totalPaid)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-sm">
                <span>{t("balanceDue")}</span>
                <span className="font-medium text-destructive">
                  {formatMNT(balanceDue)}
                </span>
              </div>
            )}
            {balanceDue > 0 && (
              <Button
                onClick={() => {
                  paymentForm.setValue("amount", balanceDue);
                  setShowPaymentDialog(true);
                }}
                size="sm"
                className="w-full"
              >
                <Wallet className="size-4" /> {t("recordPayment")}
              </Button>
            )}
            {maxRefundable > 0 && (
              <Button
                onClick={() => setShowRefundDialog(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="size-4" /> {t("recordRefund")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Refund History ── */}
      {existingInvoiceId && totalRefunded > 0 && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="flex p-4 flex-col gap-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-5 text-amber-600" />
              <Typography.Text className="font-medium text-sm">
                {t("refundHistory")}
              </Typography.Text>
            </div>
            <div className="flex flex-col gap-1.5">
              {invoiceRefunds.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {r.method} · {new Date(r.refunded_at).toLocaleDateString()}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-destructive">
                      -{formatMNT(Number(r.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => setReceiptRefund(r)}
                    >
                      <Printer className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>{t("totalRefunded")}</span>
              <span className="font-medium text-destructive">
                -{formatMNT(totalRefunded)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Refund Dialog ── */}
      {existingInvoiceId && orgId && (
        <RefundDialog
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          invoiceId={existingInvoiceId}
          orgId={orgId}
          invoiceTotal={servicesTotal + partsTotal}
          amountPaid={totalPaid}
          amountRefunded={totalRefunded}
          invoiceNumber={invoicePaymentsData?.invoice_number ?? ""}
        />
      )}

      {/* ── Refund Receipt Dialog ── */}
      {receiptRefund && (
        <Dialog
          open={!!receiptRefund}
          onOpenChange={(open) => {
            if (!open) setReceiptRefund(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("refund.receiptTitle")}</DialogTitle>
            </DialogHeader>
            <RefundReceipt
              refund={receiptRefund}
              invoice={{
                invoice_number: invoicePaymentsData?.invoice_number ?? "",
                total: servicesTotal + partsTotal,
                customer_name: wo?.customer?.full_name ?? null,
              }}
              orgName={orgName ?? ""}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Totals ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("totals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("services")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("parts")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsTotal)}
              </span>
            </div>
            {Number(wo.discount_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("discounts")}</span>
                <span className="font-medium tabular-nums text-destructive">
                  -{formatMNT(Number(wo.discount_total))}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>{t("grandTotal")}</span>
              <span className="tabular-nums">
                {formatMNT(Number(wo.total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profit / Cost Summary ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profitAndCost")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("servicesCost")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("partsCost")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsCost)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("revenueLabel")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal + partsTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("totalCost")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(totalCost)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span
                className={
                  grossProfit >= 0 ? "text-emerald-600" : "text-destructive"
                }
              >
                {grossProfit >= 0 ? t("grossProfit") : t("loss")}
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  grossProfit >= 0 ? "text-emerald-600" : "text-destructive",
                )}
              >
                {formatMNT(grossProfit)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("margin")}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  marginPercent >= 0 ? "text-emerald-600" : "text-destructive",
                )}
              >
                {marginPercent.toFixed(1)}%
              </span>
            </div>
            {wo.loss_reason && (
              <>
                <Separator />
                <div className="flex flex-col gap-1 rounded bg-destructive/5 p-2 text-xs border border-destructive/20 mt-1">
                  <span className="font-semibold text-destructive">
                    {t("lossReason")}:
                  </span>
                  <span className="text-muted-foreground">
                    {wo.loss_reason}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Repeat from Last Visit Dialog ── */}
      <Dialog open={showRepeatDialog} onOpenChange={setShowRepeatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("repeatFromLastVisit")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t("repeatDialogDesc", {
                services: ctx.lastVisit?.services.length ?? 0,
                parts: ctx.lastVisit?.parts.length ?? 0,
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRepeatDialog(false)}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleRepeatFromLastVisit}>
                {t("continue")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment Dialog ── */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recordPayment")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
            <Field data-invalid={!!paymentForm.formState.errors.amount}>
              <FieldLabel>{t("amount")}</FieldLabel>
              <FieldContent>
                <CurrencyInput
                  min={1}
                  max={balanceDue}
                  aria-invalid={!!paymentForm.formState.errors.amount}
                  value={Number(paymentForm.watch("amount")) || 0}
                  onChange={(v) =>
                    paymentForm.setValue("amount", v, { shouldValidate: true })
                  }
                  onBlur={() => paymentForm.trigger("amount")}
                />
                {paymentForm.formState.errors.amount && (
                  <FieldError>
                    {paymentForm.formState.errors.amount.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
            <Field data-invalid={!!paymentForm.formState.errors.method}>
              <FieldLabel>{t("paymentMethod")}</FieldLabel>
              <FieldContent>
                <select
                  aria-invalid={!!paymentForm.formState.errors.method}
                  className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...paymentForm.register("method")}
                >
                  <option value="cash">{t("cash")}</option>
                  <option value="card">{t("card")}</option>
                  <option value="bank_transfer">{t("bankTransfer")}</option>
                  <option value="manual">{t("manual")}</option>
                  {storeCreditBalance > 0 && (
                    <option value="store_credit">
                      {t("storeCredit")} ({formatMNT(storeCreditBalance)})
                    </option>
                  )}
                </select>
                {paymentForm.formState.errors.method && (
                  <FieldError>
                    {paymentForm.formState.errors.method.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
            {storeCreditBalance > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("storeCredit")}
                  </span>
                  <span className="font-medium text-green-600">
                    {formatMNT(storeCreditBalance)}
                  </span>
                </div>
                {storeCreditBalance >= balanceDue && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("storeCreditCoversFull")}
                  </p>
                )}
              </div>
            )}
            <Field>
              <FieldLabel>{t("referenceOptional")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("referencePlaceholder")}
                  {...paymentForm.register("reference")}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>{t("notesOptional")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("notesPlaceholder")}
                  {...paymentForm.register("notes")}
                />
              </FieldContent>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  recordPayment.isPending || paymentForm.formState.isSubmitting
                }
              >
                {recordPayment.isPending ? t("recording") : t("recordPayment")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
