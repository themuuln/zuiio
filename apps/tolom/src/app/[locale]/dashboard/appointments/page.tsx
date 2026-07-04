"use client";

import { Calendar, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import type { Appointment } from "@/lib/types";
import { AppointmentCreateSheet } from "@/components/appointments/create-drawer";
import {
  useAppointments,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from "@/lib/queries/use-appointments";

// ── Status helpers ────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Main Page ──────────────────────────────────────────────────

export default function AppointmentsPage() {
  const t = useTranslations("appointments");

  const { data: org } = useCurrentOrg();
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const orgId = org?.orgId ?? "";
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const today = new Date().toISOString().split("T")[0];

  const { data: appointmentsData, isLoading } = useAppointments(
    orgId,
    today,
    branchFilter,
  );

  const statusMutation = useUpdateAppointmentStatus(orgId);

  const deleteMutation = useDeleteAppointment(orgId);

  const appointments = (appointmentsData ?? []) as unknown as Appointment[];
  const filtered = appointments.filter((a) =>
    statusFilter === "all" ? true : a.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {Object.keys(STATUS_LABELS).length === 0 &&
              Object.keys({
                scheduled: "",
                checked_in: "",
                in_progress: "",
                completed: "",
                cancelled: "",
                no_show: "",
                requested: "",
              }).map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`status_${value}`)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("newAppointment")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t("noAppointments")}</EmptyTitle>
            <EmptyDescription>
              {statusFilter !== "all"
                ? t("noAppointmentsWithStatus", {
                    status: t(`status_${statusFilter}`),
                  })
                : t("scheduleFirst")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filtered.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(appointment.scheduled_at)}
                  </span>
                  {appointment.end_at && (
                    <>
                      <span className="text-xs text-muted-foreground">to</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(appointment.end_at)}
                      </span>
                    </>
                  )}
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="flex-1 min-w-0">
                  <Typography.Text className="font-medium block truncate">
                    {appointment.title}
                  </Typography.Text>
                  <Typography.Text className="text-sm text-muted-foreground block truncate">
                    {appointment.customer_id ?? t("noCustomer")}
                  </Typography.Text>
                </div>
                <Select
                  value={appointment.status}
                  onValueChange={(v) =>
                    statusMutation.mutate({
                      id: appointment.id,
                      status: (v ?? "scheduled") as any,
                    })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_LABELS).length === 0 &&
                      Object.keys({
                        scheduled: "",
                        checked_in: "",
                        in_progress: "",
                        completed: "",
                        cancelled: "",
                        no_show: "",
                        requested: "",
                      }).map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`status_${value}`)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate({ id: appointment.id })}
                >
                  {t("commonCancel")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AppointmentCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        onCreated={() => {
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
