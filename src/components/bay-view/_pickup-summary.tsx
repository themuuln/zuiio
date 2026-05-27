"use client";

import {
  CalendarIcon,
  Car,
  CheckCircle2,
  Printer,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatMNT } from "@/lib/utils";

interface RecommendationDisplay {
  serviceName: string;
  nextDueDate: string | null;
  nextDueKm: number | null;
  priority: "standard" | "important" | "urgent";
}

interface PickupSummaryProps {
  vehiclePlate: string;
  totalCost: number;
  invoiceId: string | null;
  invoiceTotal: number;
  invoiceStatus: string;
  recommendations: RecommendationDisplay[];
  orgId: string | null;
  onDone: () => void;
  onSaveAppointment?: (date: string) => Promise<void>;
}

const PRIORITY_STYLES: Record<string, string> = {
  standard: "border-l-blue-400",
  important: "border-l-amber-400",
  urgent: "border-l-red-400",
};

const PRIORITY_DOTS: Record<string, string> = {
  standard: "bg-blue-400",
  important: "bg-amber-400",
  urgent: "bg-red-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PickupSummary({
  vehiclePlate,
  totalCost,
  invoiceId,
  invoiceTotal,
  invoiceStatus: _invoiceStatus,
  recommendations,
  orgId,
  onDone,
  onSaveAppointment,
}: PickupSummaryProps) {
  const t = useTranslations("bayView");
  const [showBookNext, setShowBookNext] = useState(false);
  const [bookDate, setBookDate] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [payments, setPayments] = useState<Array<{id: string; amount: number; method: string; paid_at: string; reference?: string | null}>>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balanceDue, setBalanceDue] = useState(invoiceTotal);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useClientNow();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDone();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDone]);

  useEffect(() => {
    if (!invoiceId || !orgId) return;
    const abort = new AbortController();
    fetch(`/api/organizations/${orgId}/invoices/${invoiceId}`, { signal: abort.signal })
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setPayments(json.data.payments ?? []);
          setTotalPaid(Number(json.data.amount_paid ?? 0));
          setBalanceDue(Number(json.data.balance_due ?? invoiceTotal));
        }
      })
      .catch(e => { if (!abort.signal.aborted) console.error(e) });
    return () => abort.abort();
  }, [invoiceId, orgId, invoiceTotal]);

  function handlePrint() {
    window.print();
  }

  const hasRecommendations = recommendations.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm py-4"
      onClick={onDone}
      onKeyDown={(e) => { if (e.key === "Escape") onDone(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t("pickupSummaryTitle")}
      tabIndex={-1}
    >
      <Card
        className="mx-4 w-full max-w-md shadow-2xl my-auto print:shadow-none print:border-0"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b print:hidden">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {t("pickupSummaryTitle")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDone}
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col gap-5">
          {/* Vehicle + Cost */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-2">
              <Car className="size-4 text-emerald-600" />
              <span className="font-semibold text-lg tracking-wide">
                {vehiclePlate}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMNT(totalCost)}
            </p>
            <p className="text-xs text-muted-foreground/60">Total</p>
          </div>

          {/* Invoice / Payment Status — only when invoice exists */}
          {invoiceId && (
            <div className="rounded-lg border border-green-200/60 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Invoice</span>
                <Badge variant="outline">
                  {_invoiceStatus === "paid" ? "Paid" : _invoiceStatus === "partial" ? "Partial" : "Pending"}
                </Badge>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="flex flex-col gap-1">
                  {payments.map(p => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {p.method.replace(/_/g, " ")} · {new Date(p.paid_at).toLocaleDateString()}
                        {p.reference ? ` (${p.reference})` : ""}
                      </span>
                      <span className="font-medium">{formatMNT(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-xs border-t pt-1.5">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium">{formatMNT(totalPaid)}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="font-medium text-red-500">{formatMNT(balanceDue)}</span>
                </div>
              )}

              {balanceDue > 0 && (
                <Button
                  size="sm"
                  className="w-full h-9 text-xs gap-1"
                  onClick={() => {
                    setPaymentAmount(balanceDue);
                    setShowPaymentDialog(true);
                  }}
                >
                  Record Payment
                </Button>
              )}
            </div>
          )}

          {/* Recommendations */}
          {hasRecommendations && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("pickupSummaryNextService")}
              </h3>
              <div className="flex flex-col gap-1.5">
                {recommendations.map((r) => (
                  <div
                    key={`${r.serviceName}-${r.nextDueDate ?? r.nextDueKm}`}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 px-3.5 py-2.5 border-l-4",
                      PRIORITY_STYLES[r.priority] ?? "border-l-border",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        PRIORITY_DOTS[r.priority] ?? "bg-muted-foreground",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.serviceName}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {r.nextDueDate && r.nextDueKm
                          ? t("pickupSummaryNextDueDate", {
                              date: formatDate(r.nextDueDate),
                              km: r.nextDueKm.toLocaleString(),
                            })
                          : r.nextDueDate
                            ? `Due by ${formatDate(r.nextDueDate)}`
                            : r.nextDueKm
                              ? `${r.nextDueKm.toLocaleString()} km`
                              : "No schedule set"}
                      </p>
                    </div>
                    {r.priority !== "standard" && (
                      <Badge variant="outline">
                        {r.priority}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book Next Appointment */}
          {showBookNext ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <Input
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                className="h-9 text-xs"
                min={now.toISOString().split("T")[0]}
              />
              <Button
                size="sm"
                className="h-9 text-xs shrink-0"
                disabled={!bookDate}
                onClick={async () => {
                  if (bookDate && onSaveAppointment) {
                    await onSaveAppointment(bookDate);
                  }
                  setShowBookNext(false);
                  setBookDate("");
                }}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-10 text-xs gap-2"
              onClick={() => setShowBookNext(true)}
            >
              <CalendarIcon className="size-4" />
              {t("pickupSummaryBookNext")}
            </Button>
          )}

          {/* Actions */}
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="size-4" />
              {t("pickupSummaryPrint")}
            </Button>
          </div>

          {/* Done button (hidden when printing) */}
          <Button
            className="w-full h-11 print:hidden"
            onClick={onDone}
          >
            {t("done")}
          </Button>
        </CardContent>

        {/* Record Payment Dialog */}
        {showPaymentDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowPaymentDialog(false)}>
            <Card className="mx-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Record Payment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <label htmlFor="payment-amount" className="text-xs font-medium text-muted-foreground">Amount</label>
                  <Input
                    id="payment-amount"
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value) || 0)}
                    min={1}
                    max={balanceDue}
                    className="h-10"
                  />
                </div>
                <div>
                  <label htmlFor="payment-method" className="text-xs font-medium text-muted-foreground">Method</label>
                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payment-reference" className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
                  <Input
                    id="payment-reference"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Transaction ID / card last 4"
                    className="h-10"
                  />
                </div>
                <div>
                  <label htmlFor="payment-notes" className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                  <Input
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Any notes"
                    className="h-10"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(false)} disabled={recordingPayment}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!paymentAmount || paymentAmount <= 0 || recordingPayment}
                    onClick={async () => {
                      if (!invoiceId || !orgId || !paymentAmount || paymentAmount <= 0) return;
                      setRecordingPayment(true);
                      setError(null);
                      try {
                        const res = await fetch(`/api/organizations/${orgId}/invoices/${invoiceId}/payments`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            amount: paymentAmount,
                            method: paymentMethod,
                            reference: paymentReference || undefined,
                            notes: paymentNotes || undefined,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to record payment");

                        // Refresh payment data
                        const refreshRes = await fetch(`/api/organizations/${orgId}/invoices/${invoiceId}`);
                        const refreshJson = await refreshRes.json();
                        if (refreshJson.data) {
                          setPayments(refreshJson.data.payments ?? []);
                          setTotalPaid(Number(refreshJson.data.amount_paid ?? 0));
                          setBalanceDue(Number(refreshJson.data.balance_due ?? 0));
                        }

                        setShowPaymentDialog(false);
                        setPaymentReference("");
                        setPaymentNotes("");
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to record payment");
                      } finally {
                        setRecordingPayment(false);
                      }
                    }}
                  >
                    {recordingPayment ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
