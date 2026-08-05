"use client";

import {
  BellRing,
  CalendarDays,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import { useAppointments } from "@/lib/queries/use-appointments";
import { useServiceSchedules } from "@/lib/queries/use-service-reminders";
import { useWorkOrders } from "@/lib/queries/use-work-orders";

// ── Helpers ──────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

interface AgendaRow {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string;
}

interface AgendaBlockProps {
  icon: LucideIcon;
  label: string;
  count: number;
  loading: boolean;
  emptyText: string;
  viewAllHref: string;
  viewAllLabel: string;
  rows: AgendaRow[];
}

function AgendaBlock({
  icon: Icon,
  label,
  count,
  loading,
  emptyText,
  viewAllHref,
  viewAllLabel,
  rows,
}: AgendaBlockProps) {
  return (
    <div className="flex flex-col gap-2.5 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          <span>{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-5 w-8 rounded-full" />
        ) : (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
            {count}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {loading ? (
          [0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))
        ) : count === 0 ? (
          <p className="py-1 text-xs text-muted-foreground/70">{emptyText}</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.title}</p>
                {row.subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {row.subtitle}
                  </p>
                ) : null}
              </div>
              {row.meta ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {row.meta}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

      {!loading && count > 0 && (
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-primary hover:underline"
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  );
}

/**
 * "Today" strip on the dashboard — the morning launchpad. Shows what is
 * happening today: appointments, vehicles ready for pickup, and service
 * reminders that are due. Values skeleton-load; labels always render.
 */
export function TodayAgenda({ orgId }: { orgId: string | undefined }) {
  const t = useTranslations("dashboard") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const today = todayISO();

  const appointmentsQuery = useAppointments(orgId, today);
  const pickupsQuery = useWorkOrders(orgId, "Ready for Pickup");
  const schedulesQuery = useServiceSchedules(orgId);

  const loading =
    !orgId ||
    appointmentsQuery.isPending ||
    pickupsQuery.isPending ||
    schedulesQuery.isPending;

  const appointments = (appointmentsQuery.data ?? []).filter(
    (a) => a.status !== "cancelled",
  );
  const pickups = pickupsQuery.data ?? [];
  const dueReminders = (schedulesQuery.data ?? []).filter(
    (s) =>
      s.reminder_enabled &&
      s.next_due_date != null &&
      s.next_due_date <= today &&
      s.contact_status !== "contacted",
  );

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="grid gap-px bg-border p-0 md:grid-cols-3">
        <AgendaBlock
          icon={CalendarDays}
          label={t("appointmentsToday")}
          count={appointments.length}
          loading={loading}
          emptyText={t("noAppointmentsToday")}
          viewAllHref="/dashboard/appointments"
          viewAllLabel={t("viewAll")}
          rows={appointments.slice(0, 3).map((a) => ({
            key: a.id,
            title: a.title,
            subtitle: [a.customer?.first_name, a.customer?.last_name]
              .filter(Boolean)
              .join(" "),
            meta: formatTime(a.scheduled_at),
          }))}
        />
        <AgendaBlock
          icon={ClipboardCheck}
          label={t("readyForPickup")}
          count={pickups.length}
          loading={loading}
          emptyText={t("noPickupsToday")}
          viewAllHref="/dashboard/work-orders?work-orders-status=Ready%20for%20Pickup"
          viewAllLabel={t("viewAll")}
          rows={pickups.slice(0, 3).map((wo) => ({
            key: wo.id,
            title: wo.vehicle?.plate_number ?? "—",
            subtitle:
              [wo.customer?.first_name, wo.customer?.last_name]
                .filter(Boolean)
                .join(" ") || null,
            meta: formatDate(wo.created_at),
          }))}
        />
        <AgendaBlock
          icon={BellRing}
          label={t("dueServiceReminders")}
          count={dueReminders.length}
          loading={loading}
          emptyText={t("noDueReminders")}
          viewAllHref="/dashboard/service-reminders"
          viewAllLabel={t("viewAll")}
          rows={dueReminders.slice(0, 3).map((s) => ({
            key: s.id,
            title: s.service_name || "—",
            subtitle: s.vehicle?.plate_number ?? null,
            meta: s.next_due_date ? formatDate(s.next_due_date) : undefined,
          }))}
        />
      </CardContent>
    </Card>
  );
}
