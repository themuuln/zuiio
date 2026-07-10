"use client";

import {
  AlertTriangle,
  BellOff,
  Calendar,
  Clock,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useCreateServiceSchedule,
  useDeleteServiceSchedule,
  useServiceSchedules,
  useUpdateContactStatus,
  useUpdateServiceSchedule,
} from "@/lib/queries/use-service-reminders";
import { useVehicles } from "@/lib/queries/use-vehicles";
import { reportServerError } from "@/lib/sentry-report-server";
import { useSelectedBranchId } from "@/lib/stores";
import { ActionButtons } from "./_action-buttons";
import { AddScheduleDialog } from "./_add-schedule-dialog";
import { ConfigSheet } from "./_config-drawer";
import { DeleteConfirmDialog } from "./_delete-confirm-dialog";
import { EditScheduleDialog } from "./_edit-schedule-dialog";
import { ReminderLogsTab } from "./_reminder-logs-tab";
import { ScheduleRow } from "./_schedule-row";
import { formatVehicleLabel, getScheduleDueStatus } from "./_utils";

type DueStatus = "overdue" | "due-soon" | "scheduled" | "no-date";

export default function ServiceRemindersPageClient() {
  const t = useTranslations();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const {
    data: schedules = [],
    isPending,
    error,
    refetch,
  } = useServiceSchedules(orgId, undefined, branchFilter);

  const { data: vehicles = [] } = useVehicles(orgId);

  const createSchedule = useCreateServiceSchedule(orgId);
  const deleteSchedule = useDeleteServiceSchedule(orgId);
  const updateSchedule = useUpdateServiceSchedule(orgId);
  const updateContactStatus = useUpdateContactStatus(orgId);

  const [editItem, setEditItem] = useState<{
    id: string;
    service_name: string;
    interval_months: number | null;
    interval_km: number | null;
    notes: string | null;
    reminder_enabled: boolean;
  } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "logs">("schedule");
  const [deleteItem, setDeleteItem] = useState<
    (typeof schedules)[number] | null
  >(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DueStatus | "all" | "">(
    "all",
  );
  const [reminderFilter, setReminderFilter] = useState<
    "all" | "enabled" | "disabled" | ""
  >("all");

  // Derived counts
  const counts = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let overdue = 0;
    let dueSoon = 0;
    let remindersOff = 0;

    for (const s of schedules) {
      if (s.next_due_date) {
        const due = new Date(s.next_due_date);
        if (due < now) overdue++;
        else if (due < sevenDays) dueSoon++;
      }
      if (!s.reminder_enabled) remindersOff++;
    }

    return { total: schedules.length, overdue, dueSoon, remindersOff };
  }, [schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const vehicleMatch = formatVehicleLabel(item.vehicle)
          .toLowerCase()
          .includes(q);
        const serviceMatch = item.service_name.toLowerCase().includes(q);
        if (!vehicleMatch && !serviceMatch) return false;
      }
      // Status filter
      if (statusFilter && statusFilter !== "all") {
        const status = getScheduleDueStatus(item);
        if (status !== statusFilter) return false;
      }
      // Reminder filter
      if (
        reminderFilter &&
        reminderFilter === "enabled" &&
        !item.reminder_enabled
      )
        return false;
      if (
        reminderFilter &&
        reminderFilter === "disabled" &&
        item.reminder_enabled
      )
        return false;

      return true;
    });
  }, [schedules, search, statusFilter, reminderFilter]);

  const hasFilters =
    search ||
    (statusFilter !== "" && statusFilter !== "all") ||
    (reminderFilter !== "" && reminderFilter !== "all");

  const handleDelete = async () => {
    if (!orgId || !deleteItem) return;
    try {
      await deleteSchedule.mutateAsync(deleteItem.id);
      toast.dismiss();
      toast.success(t("common.deleted"));
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.dismiss();
      toast.error(
        err instanceof Error
          ? err.message
          : t("serviceReminders.failedToDelete"),
      );
    } finally {
      setDeleteItem(null);
    }
  };

  const handleEdit = (item: (typeof schedules)[number]) => {
    setEditItem(item);
    setShowEdit(true);
  };

  const handleSaveEdit = async (data: {
    id: string;
    service_name: string;
    interval_months: number | null;
    interval_km: number | null;
    notes: string | null;
    reminder_enabled: boolean;
  }) => {
    if (!orgId) return;
    await updateSchedule.mutateAsync(data);
    refetch();
  };

  const listError = error ? error.message : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("serviceReminders.title")}
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("serviceReminders.subtitle")}
          </Typography.Muted>
        </div>
        <div className="flex items-center gap-2">
          <ActionButtons
            orgId={orgId}
            onSyncComplete={() => refetch()}
            onSendComplete={() => refetch()}
          />
          <ConfigSheet orgId={orgId} />
          <AddScheduleDialog
            vehicles={vehicles}
            isPending={createSchedule.isPending}
            onAdd={async (data) => {
              await createSchedule.mutateAsync(data);
            }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {!isPending && schedules.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="py-3">
            <CardContent className="flex items-center gap-3 p-0 px-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {counts.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("serviceReminders.totalSchedules")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="flex items-center gap-3 p-0 px-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="size-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none text-destructive">
                  {counts.overdue}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("serviceReminders.overdueCount")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="flex items-center gap-3 p-0 px-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none text-amber-600">
                  {counts.dueSoon}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("serviceReminders.dueSoonCount")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="flex items-center gap-3 p-0 px-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <BellOff className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {counts.remindersOff}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("serviceReminders.remindersOff")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "schedule" | "logs")}
      >
        <TabsList>
          <TabsTrigger value="schedule">
            {t("serviceReminders.scheduleList")}
          </TabsTrigger>
          <TabsTrigger value="logs">
            {t("serviceReminders.reminderLogs")}
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4 flex flex-col gap-4">
          {/* Toolbar */}
          {schedules.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("serviceReminders.searchSchedules")}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v: string | null) =>
                  setStatusFilter((v as DueStatus | "all") || "all")
                }
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder={t("serviceReminders.filterAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("serviceReminders.filterAll")}
                  </SelectItem>
                  <SelectItem value="overdue">
                    {t("serviceReminders.filterOverdue")}
                  </SelectItem>
                  <SelectItem value="due-soon">
                    {t("serviceReminders.filterDueSoon")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={reminderFilter}
                onValueChange={(v: string | null) =>
                  setReminderFilter(
                    (v as "all" | "enabled" | "disabled") || "all",
                  )
                }
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder={t("serviceReminders.filterAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("serviceReminders.filterAll")}
                  </SelectItem>
                  <SelectItem value="enabled">
                    {t("serviceReminders.filterWithReminders")}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {t("serviceReminders.filterWithoutReminders")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setReminderFilter("all");
                  }}
                >
                  <X className="size-3 mr-1" />
                  {t("serviceReminders.clearFilters")}
                </Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {t("serviceReminders.showingCount", {
                  filtered: filteredSchedules.length,
                  total: schedules.length,
                })}
              </span>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {isPending ? (
                <div className="flex flex-col gap-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`skel-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : listError ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <Typography.Text className="text-destructive">
                    {listError}
                  </Typography.Text>
                  <Button variant="outline" onClick={() => refetch()}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : schedules.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Calendar />
                    </EmptyMedia>
                    <EmptyTitle>{t("serviceReminders.noSchedules")}</EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <AddScheduleDialog
                      vehicles={vehicles}
                      isPending={createSchedule.isPending}
                      onAdd={async (data) => {
                        await createSchedule.mutateAsync(data);
                      }}
                    />
                  </EmptyContent>
                </Empty>
              ) : (
                <>
                  {/* Table */}
                  {filteredSchedules.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-center">
                      <Typography.Muted>
                        {t("serviceReminders.noMatchingSchedules")}
                      </Typography.Muted>
                      {hasFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setReminderFilter("all");
                          }}
                        >
                          {t("serviceReminders.clearFilters")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("serviceReminders.vehicle")}</TableHead>
                          <TableHead>
                            {t("serviceReminders.serviceName")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.customer")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.interval")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.lastServiceDate")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.nextDueDate")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.reminderEnabled")}
                          </TableHead>
                          <TableHead>
                            {t("serviceReminders.contactStatus")}
                          </TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSchedules.map((item) => (
                          <ScheduleRow
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={(id) =>
                              setDeleteItem(
                                schedules.find((s) => s.id === id) ?? null,
                              )
                            }
                            onContactStatusChange={(id, status) =>
                              updateContactStatus.mutateAsync({ id, status })
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <ReminderLogsTab orgId={orgId} branchFilter={branchFilter} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditScheduleDialog
        item={editItem}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSave={handleSaveEdit}
        isPending={updateSchedule.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
        onConfirm={handleDelete}
        isPending={deleteSchedule.isPending}
      />
    </div>
  );
}
