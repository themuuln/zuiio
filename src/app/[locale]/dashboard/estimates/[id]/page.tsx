"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { EstimateDetail } from "@/lib/types";

// ── Status helpers ────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  declined: "bg-red-500",
  expired: "bg-yellow-500",
  converted: "bg-purple-500",
};

// ── Component ──────────────────────────────────────────────────

export default function EstimateDetailPage() {
  const params = useParams();
  const estimateId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";

  // Fetch estimate
  const { data: estimate, isLoading } = useQuery({
    queryKey: ["estimate", estimateId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as EstimateDetail;
    },
    enabled: !!orgId && !!estimateId,
  });

  // Status change
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Status updated");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  // Convert to work order
  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Quote converted to work order!");
      router.push(`/dashboard/work-orders/${data.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Conversion failed"),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Typography.H3>Quote not found</Typography.H3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>{estimate.estimate_number}</Typography.H2>
          <Typography.Text className="text-muted-foreground">
            Created {new Date(estimate.created_at).toLocaleDateString()}
            {estimate.customer &&
              ` · ${[estimate.customer.first_name, estimate.customer.last_name].filter(Boolean).join(" ")}`}
          </Typography.Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`${STATUS_COLORS[estimate.status] ?? "bg-gray-500"} text-white border-0`}
          >
            {STATUS_LABELS[estimate.status] ?? estimate.status}
          </Badge>

          {/* Status actions */}
          {estimate.status === "draft" && (
            <>
              <Button
                variant="outline"
                onClick={() => statusMutation.mutate("sent")}
                disabled={statusMutation.isPending}
              >
                Mark Sent
              </Button>
              <Button
                variant="default"
                onClick={() => statusMutation.mutate("approved")}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="size-4" />
                Approve
              </Button>
            </>
          )}
          {estimate.status === "sent" && (
            <Button
              variant="default"
              onClick={() => statusMutation.mutate("approved")}
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="size-4" />
              Approve
            </Button>
          )}
          {estimate.status === "approved" && (
            <Dialog>
              <DialogTrigger>
                <Button variant="default">
                  <ArrowRight className="size-4" />
                  Convert to Work Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convert to Work Order</DialogTitle>
                  <DialogDescription>
                    This will create a new work order with all items from this
                    quote. The quote will be marked as converted.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <p>
                    Customer:{" "}
                    {[
                      estimate.customer?.first_name,
                      estimate.customer?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                  {estimate.vehicle && (
                    <p>
                      Vehicle: {estimate.vehicle.plate_number} ·{" "}
                      {estimate.vehicle.make} {estimate.vehicle.model}
                    </p>
                  )}
                  <p>Items: {estimate.items?.length ?? 0}</p>
                  <p className="font-semibold">
                    Total: ₮{Number(estimate.grand_total).toLocaleString()}
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const btn = document.querySelector("[data-dialog-close]");
                      (btn as HTMLButtonElement)?.click();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => convertMutation.mutate()}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending
                      ? "Converting..."
                      : "Create Work Order"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {(estimate.status === "approved" || estimate.status === "sent") && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => statusMutation.mutate("declined")}
              disabled={statusMutation.isPending}
            >
              <XCircle className="size-4" />
              Decline
            </Button>
          )}
        </div>
      </div>

      {/* Customer & Vehicle info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {estimate.customer ? (
              <div className="space-y-1">
                <Typography.Text className="font-medium">
                  {[estimate.customer.first_name, estimate.customer.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </Typography.Text>
                {estimate.customer.phone && (
                  <Typography.Text className="text-sm text-muted-foreground block">
                    {estimate.customer.phone}
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
            <CardTitle className="text-sm">Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            {estimate.vehicle ? (
              <div className="space-y-1">
                <Typography.Text className="font-medium font-mono">
                  {estimate.vehicle.plate_number}
                </Typography.Text>
                <Typography.Text className="text-sm text-muted-foreground block">
                  {[
                    estimate.vehicle.year,
                    estimate.vehicle.make,
                    estimate.vehicle.model,
                  ]
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
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {!estimate.items?.length ? (
            <Typography.Text className="text-muted-foreground">
              No items
            </Typography.Text>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Discount</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {estimate.items.map((item, idx) => (
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2 ml-auto w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">
                ₮{Number(estimate.subtotal).toLocaleString()}
              </span>
            </div>
            {Number(estimate.discount_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono text-destructive">
                  -₮{Number(estimate.discount_total).toLocaleString()}
                </span>
              </div>
            )}
            {Number(estimate.tax_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">
                  ₮{Number(estimate.tax_total).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total</span>
              <span className="font-mono">
                ₮{Number(estimate.grand_total).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      {(estimate.notes || estimate.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography.Text className="text-sm whitespace-pre-wrap">
                  {estimate.notes}
                </Typography.Text>
              </CardContent>
            </Card>
          )}
          {estimate.terms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography.Text className="text-sm whitespace-pre-wrap">
                  {estimate.terms}
                </Typography.Text>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Linked work order */}
      {estimate.converted_work_order && (
        <Card className="border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle className="size-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <Typography.Text className="font-medium">
                Converted to work order
              </Typography.Text>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/dashboard/work-orders/${(estimate.converted_work_order as { id: string }).id}`,
                )
              }
            >
              View Work Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
