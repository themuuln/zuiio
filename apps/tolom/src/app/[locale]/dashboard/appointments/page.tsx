"use client";

import { Calendar, CalendarDays, List, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { AppointmentCreateSheet } from "@/components/appointments/create-drawer";
import { DispatchCalendar } from "@/components/dispatch-calendar";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AppointmentStatus,
  useAppointments,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from "@/lib/queries/use-appointments";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const orgId = org?.orgId ?? "";
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const dateRangeParams =
    dateRange?.from && dateRange?.to
      ? {
          from: `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, "0")}-${String(dateRange.from.getDate()).padStart(2, "0")}`,
          to: `${dateRange.to.getFullYear()}-${String(dateRange.to.getMonth() + 1).padStart(2, "0")}-${String(dateRange.to.getDate()).padStart(2, "0")}`,
        }
      : undefined;

  const { data: appointmentsData, isPending } = useAppointments(
    orgId,
    today,
    branchFilter,
    dateRangeParams,
  );

  const statusMutation = useUpdateAppointmentStatus(orgId);

  const deleteMutation = useDeleteAppointment(orgId);

  const appointments = appointmentsData ?? [];
  const filtered = appointments.filter((a) =>
    statusFilter === "all" ? true : a.status === statusFilter,
  );

  return (
    <div className="space-y-6 px-4 pt-4 pb-6 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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

          {/* Date range filter */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-[280px]"
          />

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="size-4" />
            </Button>
          </div>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("newAppointment")}
        </Button>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <DispatchCalendar
          appointments={appointments}
          onAppointmentClick={(_apt) => {
            // appointment detail drawer — not yet wired
          }}
          isLoading={isPending}
          className="h-[calc(100vh-200px)] min-h-[500px]"
        />
      ) : isPending ? (
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
        <div className="space-y-2">
          {filtered.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/30 hover:border-border transition-[color,background-color,border-color] duration-200 cursor-pointer group"
            >
              {/* Time */}
              <div className="flex flex-col items-center min-w-[60px] text-center">
                <span className="text-sm font-semibold tabular-nums">
                  {formatTime(appointment.scheduled_at)}
                </span>
                {appointment.end_at && (
                  <span className="text-[10px] text-muted-foreground">
                    to {formatTime(appointment.end_at)}
                  </span>
                )}
              </div>

              {/* Status dot */}
              <div
                className={cn(
                  "size-2.5 rounded-full shrink-0",
                  appointment.status === "scheduled" && "bg-info",
                  appointment.status === "in-progress" && "bg-success",
                  appointment.status === "completed" &&
                    "bg-muted-foreground/50",
                  appointment.status === "cancelled" && "bg-destructive/50",
                )}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {appointment.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    appointment.customer?.first_name,
                    appointment.customer?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || t("noCustomer")}
                  {appointment.vehicle?.plate_number && (
                    <span className="ml-2 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {appointment.vehicle.plate_number}
                    </span>
                  )}
                </p>
              </div>

              {/* Status select */}
              <Select
                value={appointment.status}
                onValueChange={(v) =>
                  statusMutation.mutate({
                    id: appointment.id,
                    status: (v ?? "scheduled") as AppointmentStatus,
                  })
                }
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
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

              {/* Cancel button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate({ id: appointment.id })}
              >
                {t("commonCancel")}
              </Button>
            </div>
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
