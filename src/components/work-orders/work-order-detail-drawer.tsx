"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Calendar,
  Car,
  ChevronRight,
  FileText,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useUpdateWorkOrderStatus,
  useWorkOrderDetail,
} from "@/lib/queries/use-work-order-detail";
import { cn, formatMNT } from "@/lib/utils";

// ─── Status helpers ───────────────────────────────────────────

const STATUS_NAMES: Record<string, string> = {
  New: "New",
  Diagnosing: "Diagnosing",
  "In Progress": "In Progress",
  "Ready for Pickup": "Ready for Pickup",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  Diagnosing: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  "In Progress": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "Ready for Pickup": "bg-green-500/15 text-green-500 border-green-500/30",
  Completed: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  Cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
};

const STATUS_OPTIONS = Object.keys(STATUS_NAMES).filter(
  (s) => s !== "Cancelled",
);

// ─── Props ────────────────────────────────────────────────────

interface WorkOrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
}

// ─── Component ────────────────────────────────────────────────

export function WorkOrderDetailSheet({
  open,
  onOpenChange,
  workOrderId,
}: WorkOrderDetailSheetProps) {
  const t = useTranslations("workOrderDetail");
  const queryClient = useQueryClient();
  const { data: orgData } = useCurrentOrg();
  const orgId = orgData?.orgId;

  const { data: wo, isLoading, error } = useWorkOrderDetail(orgId, workOrderId);

  const updateStatus = useUpdateWorkOrderStatus(orgId);

  const handleStatusChange = (newStatus: string) => {
    if (!orgId) return;
    updateStatus.mutate(
      { woId: workOrderId, status: newStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: workOrderKeys.all(orgId),
          });
          toast.success(`${t("statusChanged")}: ${newStatus}`);
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  // ── Loading state ──────────────────────────────────────────
  if (isLoading || !wo) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange} size="3xl">
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            <Skeleton className="h-5 w-48" />
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DetailDrawer.Body>
      </DetailDrawer>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error || !orgId) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange} size="3xl">
        <DetailDrawer.Header>
          <DetailDrawer.Title>Error</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <p className="text-muted-foreground">
            {error?.message ?? "Work order not found"}
          </p>
        </DetailDrawer.Body>
      </DetailDrawer>
    );
  }

  // ── Computed values ────────────────────────────────────────
  const servicesTotal = (wo.services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (wo.parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const grandTotal = servicesTotal + partsTotal - Number(wo.discount_total);

  const customerName = wo.customer
    ? [wo.customer.first_name, wo.customer.last_name].filter(Boolean).join(" ")
    : "—";

  const vehicleDisplay = wo.vehicle
    ? [wo.vehicle.make, wo.vehicle.model, wo.vehicle.plate_number]
        .filter(Boolean)
        .join(" ")
    : "—";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="3xl">
      {/* Header */}
      <DetailDrawer.Header>
        <div className="flex items-center justify-between">
          <DetailDrawer.Title>
            <span className="font-mono">#{workOrderId.slice(0, 8)}</span>
          </DetailDrawer.Title>
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton={false}
              render={
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 cursor-pointer hover:opacity-80 transition-opacity",
                    STATUS_COLORS[wo.status] ??
                      "bg-gray-500/15 text-gray-500 border-gray-500/30",
                  )}
                >
                  {wo.status}
                  <ArrowUpDown className="size-3 opacity-60" />
                </Badge>
              }
            />
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuGroup>
                {STATUS_OPTIONS.flatMap((s) =>
                  s !== wo.status
                    ? [
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={updateStatus.isPending}
                        >
                          {s}
                        </DropdownMenuItem>,
                      ]
                    : [],
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DetailDrawer.Header>

      {/* Body */}
      <DetailDrawer.Body className="space-y-5">
        {/* Customer & Vehicle */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="size-3" />
              Customer
            </div>
            <p className="text-sm font-medium">{customerName}</p>
            {wo.customer?.phone && (
              <p className="text-xs text-muted-foreground">
                {wo.customer.phone}
              </p>
            )}
            {wo.customer?.email && (
              <p className="text-xs text-muted-foreground truncate">
                {wo.customer.email}
              </p>
            )}
          </div>
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Car className="size-3" />
              Vehicle
            </div>
            <p className="text-sm font-medium">{vehicleDisplay}</p>
            {wo.vehicle?.vin && (
              <p className="text-xs text-muted-foreground font-mono">
                VIN: {wo.vehicle.vin}
              </p>
            )}
            {wo.odometer_at_service && (
              <p className="text-xs text-muted-foreground">
                Odometer: {wo.odometer_at_service.toLocaleString()} km
              </p>
            )}
          </div>
        </div>

        {/* Complaint / Description */}
        {(wo.complaint || wo.description) && (
          <div className="rounded-lg border p-3 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {wo.complaint ? "Complaint" : "Description"}
            </span>
            <p className="text-sm text-muted-foreground">
              {wo.complaint || wo.description}
            </p>
          </div>
        )}

        {/* Services */}
        <DetailDrawer.Section label="Services">
          {(wo.services ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No services</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right w-16">Qty</TableHead>
                    <TableHead className="text-right w-24">Price</TableHead>
                    <TableHead className="text-right w-24">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(wo.services ?? []).map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="text-sm">
                        {svc.service_name}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {svc.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatMNT(svc.unit_price)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {formatMNT(svc.final_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-right text-sm font-medium"
                    >
                      Services Total
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatMNT(servicesTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DetailDrawer.Section>

        {/* Parts */}
        <DetailDrawer.Section label="Parts">
          {(wo.parts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-right w-16">Qty</TableHead>
                    <TableHead className="text-right w-24">Price</TableHead>
                    <TableHead className="text-right w-24">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(wo.parts ?? []).map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="text-sm">
                        {part.part_name}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatMNT(part.unit_price)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {formatMNT(part.final_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-right text-sm font-medium"
                    >
                      Parts Total
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatMNT(partsTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DetailDrawer.Section>

        {/* Financial Summary */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Services</span>
            <span className="tabular-nums">{formatMNT(servicesTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Parts</span>
            <span className="tabular-nums">{formatMNT(partsTotal)}</span>
          </div>
          {Number(wo.discount_total) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums text-destructive">
                -{formatMNT(Number(wo.discount_total))}
              </span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-sm font-semibold">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatMNT(grandTotal)}</span>
          </div>
          {wo.loss_reason && (
            <p className="text-xs text-destructive pt-1">{wo.loss_reason}</p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3" />
            <span>Created: {new Date(wo.created_at).toLocaleDateString()}</span>
          </div>
          {wo.completed_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              <span>
                Completed: {new Date(wo.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </DetailDrawer.Body>

      {/* Footer */}
      <DetailDrawer.Footer className="flex-row items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {wo.mechanic?.full_name
            ? `Mechanic: ${wo.mechanic.full_name}`
            : "No mechanic assigned"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.open(`/dashboard/work-orders/${workOrderId}`, "_blank");
          }}
        >
          <FileText className="size-3.5 mr-1.5" />
          Open Full Page
          <ChevronRight className="size-3.5 ml-1" />
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
