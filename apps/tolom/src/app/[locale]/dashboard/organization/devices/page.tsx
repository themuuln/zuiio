"use client";

import { Smartphone, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DeviceRegistrationDialog } from "@/components/bay-view-v2/device-registration-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import {
  useClockDevices,
  useDeleteClockDevice,
} from "@/lib/queries/use-clock-devices";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";

// ── Page ─────────────────────────────────────────────────────────

export default function DevicesPage() {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";

  const {
    data: devices = [],
    isPending,
    error,
    refetch,
  } = useClockDevices(orgId);

  const deleteDevice = useDeleteClockDevice(orgId);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!revokingId) return;
    try {
      await deleteDevice.mutateAsync({ deviceId: revokingId });
      setRevokingId(null);
    } catch (error) {
      reportServerError("Unexpected error", error);
      // Toast handled by useOrgMutation
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString();
  };

  // ── Loading state ───────────────────────────────────────────

  if (isPending && devices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-lg border">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="ml-auto h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────

  if (error && devices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("deviceManagement.title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("deviceManagement.subtitle")}
          </Typography.Muted>
        </div>
        <div className="rounded-lg border p-6">
          <Typography.Text className="text-destructive">
            {error.message}
          </Typography.Text>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("deviceManagement.title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("deviceManagement.subtitle")}
          </Typography.Muted>
        </div>
        <Button onClick={() => setShowRegisterDialog(true)}>
          <Smartphone className="mr-2 size-4" />
          {t("deviceRegistration.title")}
        </Button>
      </div>

      {/* Empty state */}
      {!isPending && devices.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Smartphone className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t("deviceManagement.noDevices")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}

      {/* Devices table */}
      {devices.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("deviceManagement.mechanicName") || "Mechanic"}
                </TableHead>
                <TableHead>
                  {t("deviceManagement.deviceNameLabel") || "Device"}
                </TableHead>
                <TableHead>{t("deviceManagement.lastUsed")}</TableHead>
                <TableHead>{t("deviceManagement.status")}</TableHead>
                <TableHead className="w-20">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.deviceId}>
                  <TableCell className="font-medium">
                    {device.mechanicName || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.deviceName || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(device.lastUsedAt)}
                  </TableCell>
                  <TableCell>
                    {device.isActive ? (
                      <Badge variant="outline">
                        {t("deviceManagement.active")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("deviceManagement.revoked_status")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.isActive && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRevokingId(device.deviceId)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Register device dialog */}
      <DeviceRegistrationDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        orgId={orgId}
      />

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokingId}
        onOpenChange={(open) => {
          if (!open) setRevokingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deviceManagement.revokeConfirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deviceManagement.revokeConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDevice.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteDevice.isPending}
              onClick={handleRevoke}
            >
              {deleteDevice.isPending
                ? t("common.saving")
                : t("deviceManagement.revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
