"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApproveTransfer,
  useCancelTransfer,
  useMarkInTransit,
  useReceiveTransfer,
  useTransfer,
} from "@/lib/queries/use-transfers";
import { formatMNT } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; color: string; icon: typeof Clock }
> = {
  pending: {
    labelKey: "transferStatusPending",
    color:
      "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  approved: {
    labelKey: "transferStatusApproved",
    color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
    icon: CheckCircle2,
  },
  in_transit: {
    labelKey: "transferStatusInTransit",
    color:
      "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
    icon: Send,
  },
  received: {
    labelKey: "transferStatusReceived",
    color:
      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  completed: {
    labelKey: "transferStatusCompleted",
    color:
      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  cancelled: {
    labelKey: "transferStatusCancelled",
    color: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

interface TransferDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  transferId: string;
}

export function TransferDetailSheet({
  open,
  onOpenChange,
  orgId,
  transferId,
}: TransferDetailSheetProps) {
  const t = useTranslations("inventory") as (key: string, values?: Record<string, string | number>) => string;
  const { data: transfer, isPending } = useTransfer(orgId, transferId);
  const approveMutation = useApproveTransfer(orgId);
  const transitMutation = useMarkInTransit(orgId);
  const receiveMutation = useReceiveTransfer(orgId);
  const cancelMutation = useCancelTransfer(orgId);

  const loadingState = isPending || !transfer;

  if (loadingState) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </DetailDrawer>
    );
  }

  const statusCfg = STATUS_CONFIG[transfer.status];
  const StatusIcon = statusCfg?.icon ?? Clock;

  const items = transfer.items ?? [];
  const totalCost = items.reduce(
    (sum, item) => sum + (item.unit_cost ?? 0) * item.quantity,
    0,
  );

  // Determine which actions are available
  const actions: Array<{
    label: string;
    onClick: () => void;
    variant: "default" | "outline" | "destructive";
    loading: boolean;
  }> = [];

  if (transfer.status === "pending") {
    actions.push({
      label: t("transferApprove"),
      onClick: () => approveMutation.mutateAsync(transferId),
      variant: "default",
      loading: approveMutation.isPending,
    });
    actions.push({
      label: t("transferCancel"),
      onClick: () => cancelMutation.mutateAsync(transferId),
      variant: "destructive",
      loading: cancelMutation.isPending,
    });
  }

  if (transfer.status === "approved") {
    actions.push({
      label: t("transferMarkInTransit"),
      onClick: () => transitMutation.mutateAsync(transferId),
      variant: "default",
      loading: transitMutation.isPending,
    });
    actions.push({
      label: t("transferCancel"),
      onClick: () => cancelMutation.mutateAsync(transferId),
      variant: "destructive",
      loading: cancelMutation.isPending,
    });
  }

  if (["approved", "in_transit"].includes(transfer.status)) {
    actions.push({
      label: t("transferReceive"),
      onClick: () => receiveMutation.mutateAsync(transferId),
      variant: "default",
      loading: receiveMutation.isPending,
    });
  }

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2">
          {t("transferDetail")}
          {statusCfg && (
            <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
              <StatusIcon className="mr-1 size-3" />
              {t(statusCfg.labelKey)}
            </Badge>
          )}
        </DetailDrawer.Title>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {/* Branches */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">
            {transfer.from_branch_name ?? t("transferAnyBranch")}
          </span>
          <ArrowRightLeft className="size-4 text-muted-foreground" />
          <span className="font-medium">{transfer.to_branch_name}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>
            {t("transferCreatedBy")}: {transfer.created_by_name ?? "—"}
          </span>
          <span>
            {new Date(transfer.created_at).toLocaleDateString("mn-MN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {transfer.completed_at && (
            <span>
              {t("transferCompleted")}:{" "}
              {new Date(transfer.completed_at).toLocaleDateString("mn-MN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Notes */}
        {transfer.notes && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {transfer.notes}
          </div>
        )}

        {/* Items table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("transferPart")}</TableHead>
                <TableHead className="text-right">{t("transferQty")}</TableHead>
                <TableHead className="text-right">
                  {t("transferUnitCost")}
                </TableHead>
                <TableHead className="text-right">
                  {t("transferTotal")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.part_name ?? "Unknown"}
                      </span>
                      {item.part_number && (
                        <span className="text-xs text-muted-foreground">
                          {item.part_number}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity} {item.unit ?? ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.unit_cost != null ? formatMNT(item.unit_cost) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {item.unit_cost != null
                      ? formatMNT(item.unit_cost * item.quantity)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {totalCost > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    {t("transferTotalCost")}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatMNT(totalCost)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DetailDrawer.Body>

      {actions.length > 0 && (
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions justify="end">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                onClick={action.onClick}
                disabled={action.loading}
              >
                {action.loading && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {action.label}
              </Button>
            ))}
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      )}
    </DetailDrawer>
  );
}
