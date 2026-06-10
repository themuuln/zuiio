"use client";

import {
  ArrowRight,
  CheckCircle,
  Copy,
  Download,
  Link as LinkIcon,
  Pencil,
  Send,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/lib/i18n/navigation";
import {
  useConvertEstimate,
  useEstimateDetail,
  useUpdateEstimateStatus,
} from "@/lib/queries/use-estimates";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Customer, EstimateItem, Vehicle } from "@/lib/types";

// Extended type that includes all estimate fields (database.types.ts is simplified)
interface EstimateFull {
  id: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string;
  vehicle_id: string;
  estimate_number: string;
  status: string;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  converted_work_order_id: string | null;
  appointment_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  public_token: string;
  customer: Customer | null;
  vehicle: Vehicle | null;
  items: EstimateItem[];
  converted_work_order: {
    id: string;
    status: string;
    total: number;
  } | null;
  appointment: {
    id: string;
    title: string;
    scheduled_at: string;
  } | null;
}

// ── Types ──────────────────────────────────────────────────────

interface EditableLine {
  id: string;
  tempId?: string;
  item_type: "service" | "part" | "custom";
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
}

// ── Helpers ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  declined: "bg-red-500",
  expired: "bg-yellow-500",
  converted: "bg-purple-500",
};

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

function itemsToLines(items: EstimateItem[]): EditableLine[] {
  return items.map((item) => ({
    id: item.id,
    item_type: item.item_type as EditableLine["item_type"],
    description: item.description,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    discount_amount: Number(item.discount_amount),
    discount_percentage: Number(item.discount_percentage),
    line_total: Number(item.line_total),
  }));
}

// ── Component ──────────────────────────────────────────────────

export default function EstimateDetailPage() {
  const t = useTranslations("estimates");
  const params = useParams();
  const estimateId = params.id as string;
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";

  const { data: estimateData, isLoading } = useEstimateDetail(
    orgId || undefined,
    estimateId,
  );
  const est = estimateData as unknown as EstimateFull | undefined;
  const statusMutation = useUpdateEstimateStatus(orgId || undefined);
  const convertMutation = useConvertEstimate(orgId || undefined);

  // ── Edit state ───────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editLines, setEditLines] = useState<EditableLine[]>([]);
  const [editDiscountAmount, setEditDiscountAmount] = useState(0);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editTaxTotal, setEditTaxTotal] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [saving, setSaving] = useState(false);

  // Navigate to work order after successful conversion
  useEffect(() => {
    if (convertMutation.data?.id) {
      router.push(`/dashboard/work-orders/${convertMutation.data.id}`);
    }
  }, [convertMutation.data?.id, router]);

  const startEditing = useCallback(() => {
    if (!est) return;
    setEditLines(itemsToLines(est.items ?? []));
    setEditDiscountAmount(Number(est.discount_amount ?? 0));
    setEditDiscountPercent(Number(est.discount_percentage ?? 0));
    setEditTaxTotal(Number(est.tax_total ?? 0));
    setEditNotes(est.notes ?? "");
    setEditTerms(est.terms ?? "");
    setIsEditing(true);
  }, [est]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const updateLine = useCallback(
    (id: string, updates: Partial<EditableLine>) => {
      setEditLines((prev) =>
        prev.map((line) => {
          if (line.id !== id) return line;
          const updated = { ...line, ...updates };
          updated.line_total = calculateLineTotal(updated);
          return updated;
        }),
      );
    },
    [],
  );

  const removeLine = useCallback((id: string) => {
    setEditLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const saveEdits = useCallback(async () => {
    if (editLines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discount_amount: editDiscountAmount,
            discount_percentage: editDiscountPercent,
            tax_total: editTaxTotal,
            notes: editNotes || undefined,
            terms: editTerms || undefined,
            items: editLines.map((l) => ({
              item_type: l.item_type,
              description: l.description,
              quantity: l.quantity,
              unit_price: l.unit_price,
              discount_amount: l.discount_amount,
              discount_percentage: l.discount_percentage,
            })),
          }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setIsEditing(false);
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [
    orgId,
    estimateId,
    editLines,
    editDiscountAmount,
    editDiscountPercent,
    editTaxTotal,
    editNotes,
    editTerms,
    t,
  ]);

  // ── Duplicate ────────────────────────────────────────────
  const handleDuplicate = useCallback(async () => {
    if (!est) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: est.customer_id,
          vehicle_id: est.vehicle_id,
          notes: est.notes ?? undefined,
          terms: est.terms ?? undefined,
          discount_amount: est.discount_amount,
          discount_percentage: est.discount_percentage,
          tax_total: est.tax_total,
          items: (est.items ?? []).map((item) => ({
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            discount_percentage: item.discount_percentage,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success("Estimate duplicated");
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }, [est, orgId, router]);

  // ── Edit totals ──────────────────────────────────────────
  const editSubtotal = editLines.reduce((s, l) => s + l.line_total, 0);
  const editDiscountTotal =
    editDiscountAmount + editSubtotal * (editDiscountPercent / 100);
  const editGrandTotal = Math.max(
    editSubtotal - editDiscountTotal + editTaxTotal,
    0,
  );

  // ── Render ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!est) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Typography.H3>{t("notFound")}</Typography.H3>
      </div>
    );
  }

  const isEditable = !isEditing && ["draft", "sent"].includes(est.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>{est.estimate_number}</Typography.H2>
          <Typography.Text className="text-muted-foreground">
            Created {new Date(est.created_at).toLocaleDateString()}
            {est.customer &&
              ` · ${[est.customer.first_name, est.customer.last_name].filter(Boolean).join(" ")}`}
          </Typography.Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`${STATUS_COLORS[est.status] ?? "bg-gray-500"} text-white border-0`}
          >
            {t(`status_${est.status}`)}
          </Badge>

          {/* Edit / Duplicate / Save / Cancel */}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button onClick={saveEdits} disabled={saving}>
                {saving ? t("saving") : t("saveChanges")}
              </Button>
            </>
          ) : (
            <>
              {isEditable && (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
              <Button variant="outline" onClick={handleDuplicate}>
                <Copy className="size-4" />
                Duplicate
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
                PDF
              </Button>
              {est.public_token && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/estimate/${est.public_token}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  <LinkIcon className="size-4" />
                  Share
                </Button>
              )}
            </>
          )}

          {/* Status actions (read-only mode) */}
          {!isEditing && est.status === "draft" && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!est.customer?.email) {
                    toast.error("Customer has no email address");
                    return;
                  }
                  try {
                    const res = await fetch(
                      `/api/organizations/${orgId}/estimates/${estimateId}/send`,
                      { method: "POST" },
                    );
                    const json = await res.json();
                    if (json.error) throw new Error(json.error.message);
                    toast.success("Estimate sent to customer");
                    // Refresh data
                    statusMutation.mutate({ estimateId, status: "sent" });
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Failed to send",
                    );
                  }
                }}
                disabled={statusMutation.isPending}
              >
                <Send className="size-4" />
                Send to customer
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  statusMutation.mutate({ estimateId, status: "approved" })
                }
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="size-4" />
                {t("approve")}
              </Button>
            </>
          )}
          {!isEditing && est.status === "sent" && (
            <Button
              variant="default"
              onClick={() =>
                statusMutation.mutate({ estimateId, status: "approved" })
              }
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="size-4" />
              Approve
            </Button>
          )}
          {!isEditing && est.status === "approved" && (
            <Dialog>
              <DialogTrigger>
                <Button variant="default">
                  <ArrowRight className="size-4" />
                  {t("convertToWorkOrder")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("convertToWorkOrder")}</DialogTitle>
                  <DialogDescription>
                    {t("convertDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <p>
                    {t("customerInfo")}:{" "}
                    {[est.customer?.first_name, est.customer?.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                  {est.vehicle && (
                    <p>
                      {t("vehicleInfo")}: {est.vehicle.plate_number} ·{" "}
                      {est.vehicle.make} {est.vehicle.model}
                    </p>
                  )}
                  <p>Items: {est.items?.length ?? 0}</p>
                  <p className="font-semibold">
                    {t("total")}: ₮{Number(est.grand_total).toLocaleString()}
                  </p>
                </div>
                <DialogFooter>
                  <DialogTrigger>
                    <Button variant="outline">{t("cancel")}</Button>
                  </DialogTrigger>
                  <Button
                    onClick={() => convertMutation.mutate({ estimateId })}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending
                      ? t("converting")
                      : t("createWorkOrder")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {!isEditing &&
            (est.status === "approved" || est.status === "sent") && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() =>
                  statusMutation.mutate({ estimateId, status: "declined" })
                }
                disabled={statusMutation.isPending}
              >
                <XCircle className="size-4" />
                {t("decline")}
              </Button>
            )}
        </div>
      </div>

      {/* Customer & Vehicle info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("customer")}</CardTitle>
          </CardHeader>
          <CardContent>
            {est.customer ? (
              <div className="space-y-1">
                <Typography.Text className="font-medium">
                  {[est.customer.first_name, est.customer.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </Typography.Text>
                {est.customer.phone && (
                  <Typography.Text className="text-sm text-muted-foreground block">
                    {est.customer.phone}
                  </Typography.Text>
                )}
              </div>
            ) : (
              <Typography.Text className="text-muted-foreground">
                —
              </Typography.Text>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("vehicle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {est.vehicle ? (
              <div className="space-y-1">
                <Typography.Text className="font-medium font-mono">
                  {est.vehicle.plate_number}
                </Typography.Text>
                <Typography.Text className="text-sm text-muted-foreground block">
                  {[est.vehicle.year, est.vehicle.make, est.vehicle.model]
                    .filter(Boolean)
                    .join(" ")}
                </Typography.Text>
              </div>
            ) : (
              <Typography.Text className="text-muted-foreground">
                —
              </Typography.Text>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("lineItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            /* ── Edit mode ─────────────────────────────────── */
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-3">{t("description")}</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-right">Disc %</div>
                <div className="col-span-1 text-right">Disc ₮</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {editLines.map((line, idx) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2"
                >
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="col-span-3">
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
                      <div>
                        <Typography.Text className="text-sm truncate block">
                          {line.description}
                        </Typography.Text>
                        <span className="text-xs text-muted-foreground">
                          {line.item_type}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(line.id, {
                          unit_price: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
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
                            Math.min(100, Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
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
                            Number(e.target.value) || 0,
                          ),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm font-medium">
                    ₮{line.line_total.toLocaleString()}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => removeLine(line.id)}
                    >
                      <XCircle className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Read-only mode ────────────────────────────── */
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                <div className="col-span-1">{t("number")}</div>
                <div className="col-span-4">{t("description")}</div>
                <div className="col-span-1 text-right">{t("qty")}</div>
                <div className="col-span-2 text-right">{t("unitPrice")}</div>
                <div className="col-span-2 text-right">{t("discount")}</div>
                <div className="col-span-2 text-right">{t("total")}</div>
              </div>
              {est.items?.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border p-3"
                >
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="col-span-4">
                    <Typography.Text className="text-sm">
                      {item.description}
                    </Typography.Text>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 ml-2"
                    >
                      {item.item_type}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right text-sm">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono">
                    ₮{Number(item.unit_price).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right text-sm text-muted-foreground">
                    {Number(item.discount_amount) > 0 &&
                      `₮${Number(item.discount_amount).toLocaleString()}`}
                    {Number(item.discount_percentage) > 0 &&
                      `${Number(item.discount_amount) > 0 ? " + " : ""}${item.discount_percentage}%`}
                    {Number(item.discount_amount) === 0 &&
                      Number(item.discount_percentage) === 0 &&
                      "—"}
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono font-medium">
                    ₮{Number(item.line_total).toLocaleString()}
                  </div>
                </div>
              ))}
              {!est.items?.length && (
                <Typography.Text className="text-muted-foreground">
                  {t("noItems")}
                </Typography.Text>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3 ml-auto w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-mono">
                ₮
                {(isEditing
                  ? editSubtotal
                  : Number(est.subtotal)
                ).toLocaleString()}
              </span>
            </div>

            {/* Discount */}
            {isEditing ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">
                  {t("discount")}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editDiscountPercent}
                    onChange={(e) =>
                      setEditDiscountPercent(
                        Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      )
                    }
                    className="h-7 w-14 text-xs text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <span className="text-xs text-muted-foreground">+</span>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={editDiscountAmount}
                    onChange={(e) =>
                      setEditDiscountAmount(
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    className="h-7 w-20 text-xs text-right"
                  />
                </div>
              </div>
            ) : (
              Number(est.discount_total) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("discount")}</span>
                  <span className="font-mono text-destructive">
                    -₮{Number(est.discount_total).toLocaleString()}
                  </span>
                </div>
              )
            )}

            {/* Tax */}
            {isEditing ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">
                  {t("tax")}
                </span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={editTaxTotal}
                  onChange={(e) =>
                    setEditTaxTotal(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-7 w-24 text-xs text-right ml-auto"
                />
              </div>
            ) : (
              Number(est.tax_total) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span className="font-mono">
                    ₮{Number(est.tax_total).toLocaleString()}
                  </span>
                </div>
              )
            )}

            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>{t("grandTotal")}</span>
              <span className="font-mono">
                ₮
                {(isEditing
                  ? editGrandTotal
                  : Number(est.grand_total)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Typography.Text className="text-sm font-medium">
              {t("notes")}
            </Typography.Text>
            <Textarea
              placeholder={t("notesPlaceholder")}
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Typography.Text className="text-sm font-medium">
              {t("terms")}
            </Typography.Text>
            <Textarea
              placeholder={t("termsPlaceholder")}
              rows={3}
              value={editTerms}
              onChange={(e) => setEditTerms(e.target.value)}
            />
          </div>
        </div>
      ) : (
        (est.notes || est.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {est.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("notes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography.Text className="text-sm whitespace-pre-wrap">
                    {est.notes}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}
            {est.terms && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("terms")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography.Text className="text-sm whitespace-pre-wrap">
                    {est.terms}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}

      {/* Linked work order */}
      {est.converted_work_order && (
        <Card className="border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle className="size-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <Typography.Text className="font-medium">
                {t("convertedToWorkOrder")}
              </Typography.Text>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/dashboard/work-orders/${(est.converted_work_order as { id: string }).id}`,
                )
              }
            >
              {t("viewWorkOrder")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
