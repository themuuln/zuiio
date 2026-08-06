"use client";

import { ChevronLeft, ChevronRight, Clock, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppointmentDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────

function deriveCustomerName(apt: AppointmentDetail): string {
  return (
    [apt.customer?.first_name, apt.customer?.last_name]
      .filter(Boolean)
      .join(" ") || ""
  );
}

function deriveVehiclePlate(apt: AppointmentDetail): string {
  return apt.vehicle?.plate_number ?? "";
}

function deriveMechanicName(apt: AppointmentDetail): string {
  return apt.mechanic?.full_name ?? "";
}

interface DispatchCalendarProps {
  appointments: AppointmentDetail[];
  onAppointmentClick?: (appointment: AppointmentDetail) => void;
  isLoading?: boolean;
  className?: string;
}

// ── Constants ──────────────────────────────────────────────────

const HOUR_HEIGHT = 72; // px per hour - more breathing room
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

const STATUS_STYLES: Record<
  string,
  { bg: string; border: string; text: string; dot: string; ring: string }
> = {
  scheduled: {
    bg: "bg-info/10",
    border: "border-info/30",
    text: "text-info",
    dot: "bg-info",
    ring: "ring-info/20",
  },
  "in-progress": {
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    dot: "bg-success",
    ring: "ring-success/20",
  },
  completed: {
    bg: "bg-muted/50",
    border: "border-border/50",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    ring: "ring-muted/20",
  },
  cancelled: {
    bg: "bg-destructive/5",
    border: "border-destructive/20",
    text: "text-destructive",
    dot: "bg-destructive/50",
    ring: "ring-destructive/10",
  },
};

// ── Helpers ────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12)
    return `${hour === 0 ? 12 : 12} ${hour < 12 ? "AM" : "PM"}`;
  return `${hour > 12 ? hour - 12 : hour} ${hour < 12 ? "AM" : "PM"}`;
}

// ── Appointment Block ──────────────────────────────────────────

function AppointmentBlock({
  appointment,
  onClick,
}: {
  appointment: AppointmentDetail;
  onClick?: () => void;
}) {
  const d = new Date(appointment.scheduled_at);
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const duration = 60;
  const top = (hour - 7 + minutes / 60) * HOUR_HEIGHT;
  const height = Math.max((duration / 60) * HOUR_HEIGHT - 4, 32);
  const styles = STATUS_STYLES[appointment.status] ?? STATUS_STYLES.scheduled;
  const customerName = deriveCustomerName(appointment);
  const vehiclePlate = deriveVehiclePlate(appointment);
  const mechanicName = deriveMechanicName(appointment);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute left-1.5 right-1.5 rounded-lg border p-2.5 text-left transition-[transform,box-shadow,opacity] duration-200",
        "hover:shadow-lg hover:scale-[1.02] hover:z-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "cursor-pointer group",
        styles.bg,
        styles.border,
        styles.ring,
      )}
      style={{ top, height }}
    >
      {/* Status dot + plate */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            "size-2.5 rounded-full shrink-0 ring-2 ring-white/50",
            styles.dot,
          )}
        />
        <span className="text-xs font-bold font-mono tracking-tight truncate">
          {vehiclePlate}
        </span>
      </div>

      {/* Customer name */}
      <p className="text-sm font-medium truncate mb-0.5">{customerName}</p>

      {/* Service (only if enough space) */}
      {height > 56 && (
        <p className="text-xs text-muted-foreground truncate">
          {appointment.description}
        </p>
      )}

      {/* Mechanic (only if enough space) */}
      {height > 72 && mechanicName && (
        <div className={cn("flex items-center gap-1 mt-1", styles.text)}>
          <Wrench className="size-3 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium truncate">{mechanicName}</span>
        </div>
      )}
    </button>
  );
}

// ── Time Column ────────────────────────────────────────────────

function TimeColumn() {
  return (
    <div className="w-14 shrink-0 border-r border-border/50">
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="border-b border-border/30 text-xs text-muted-foreground/70 font-medium"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="relative -top-2.5 pl-2 text-[11px]">
            {formatHour(hour)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-14 shrink-0 border-r border-border/50 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 mb-2" />
          ))}
        </div>
        <div className="flex-1 p-4 gap-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Current Time Line ──────────────────────────────────────────

function CurrentTimeIndicator() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  if (hour < 7 || hour > 18) return null;

  const top = (hour - 7 + minutes / 60) * HOUR_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
      style={{ top }}
    >
      <div className="size-3 rounded-full bg-destructive -ml-1.5 ring-2 ring-destructive/20" />
      <div className="h-[2px] flex-1 bg-gradient-to-r from-destructive to-destructive/0" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function DispatchCalendar({
  appointments,
  onAppointmentClick,
  isLoading,
  className,
}: DispatchCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayAppointments = useMemo(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return appointments.filter((a) => a.scheduled_at.startsWith(dateStr));
  }, [appointments, selectedDate]);

  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-xl border border-border/50",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goToPrevDay}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant={
              selectedDate.toDateString() === new Date().toDateString()
                ? "secondary"
                : "ghost"
            }
            size="sm"
            onClick={goToToday}
            className="font-medium"
          >
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextDay}>
            <ChevronRight className="size-4" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <h3 className="text-sm font-semibold">
              {formatDate(selectedDate)}
            </h3>
            {dayAppointments.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {dayAppointments.length}
              </span>
            )}
          </div>
        </div>

        {/* Status legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-info" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" /> In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/50" />{" "}
            Completed
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-1 overflow-hidden">
        <TimeColumn />

        <ScrollArea className="flex-1">
          <div className="relative" style={{ height: totalHeight }}>
            {/* Hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-b border-border/30"
                style={{ top: (hour - 7) * HOUR_HEIGHT }}
              />
            ))}

            {/* Current time indicator */}
            {selectedDate.toDateString() === new Date().toDateString() && (
              <CurrentTimeIndicator />
            )}

            {/* Appointment blocks */}
            {dayAppointments.map((apt) => (
              <AppointmentBlock
                key={apt.id}
                appointment={apt}
                onClick={() => onAppointmentClick?.(apt)}
              />
            ))}

            {/* Empty state */}
            {dayAppointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Clock className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No appointments</p>
                  <p className="text-xs">Click + to schedule</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
