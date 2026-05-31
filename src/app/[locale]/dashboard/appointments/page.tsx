"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { AppointmentCreateSheet } from "./_create-sheet";

// ── Status helpers ────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── Main Page ──────────────────────────────────────────────────

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data: org } = useCurrentOrg();
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const orgId = org?.orgId ?? "";

  const today = new Date().toISOString().split("T")[0];

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", orgId, today],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/appointments?date=${today}`,
      );
      const json = await res.json();
      return (json.data ?? []) as Appointment[];
    },
    enabled: !!orgId,
  });

  // Update appointment status
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/appointments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment updated");
    },
    onError: () => toast.error("Failed to update appointment"),
  });

  // Delete appointment
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/appointments/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    },
    onError: () => toast.error("Failed to cancel appointment"),
  });

  // Filter
  const filtered = (appointments ?? []).filter((a) =>
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
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Appointment
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
            <EmptyTitle>No appointments</EmptyTitle>
            <EmptyDescription>
              {statusFilter !== "all"
                ? `No appointments with status "${STATUS_LABELS[statusFilter] ?? statusFilter}"`
                : "Schedule your first appointment to get started"}
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
                    {appointment.customer_id ?? "No customer"}
                  </Typography.Text>
                </div>
                <Select
                  value={appointment.status}
                  onValueChange={(v) =>
                    statusMutation.mutate({
                      id: appointment.id,
                      status: (v ?? "scheduled") as AppointmentStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(appointment.id)}
                >
                  Cancel
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
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
