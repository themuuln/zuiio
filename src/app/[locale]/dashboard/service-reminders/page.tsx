"use client";

import {
  AlertCircle,
  Bell,
  BellOff,
  Calendar,
  History,
  Mail,
  Plus,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useCreateServiceSchedule,
  useDeleteServiceSchedule,
  useReminderLogs,
  useServiceSchedules,
  type ServiceScheduleItem,
} from "@/lib/queries/use-service-reminders";
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function ScheduleRow({
  item,
  onDelete,
}: {
  item: ServiceScheduleItem;
  onDelete: (id: string) => void;
}) {
  const dueDate = item.next_due_date
    ? new Date(item.next_due_date)
    : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isSoon =
    dueDate &&
    !isOverdue &&
    dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {item.vehicle
          ? `${item.vehicle.make} ${item.vehicle.model} ${item.vehicle.plate_number}`
          : "—"}
      </TableCell>
      <TableCell>{item.service_name}</TableCell>
      <TableCell>
        {item.interval_months ? `${item.interval_months}mo` : "—"}
        {item.interval_km
          ? item.interval_months
            ? ` / ${item.interval_km.toLocaleString()}km`
            : `${item.interval_km.toLocaleString()}km`
          : ""}
      </TableCell>
      <TableCell>
        {item.last_service_date
          ? formatDate(item.last_service_date)
          : "—"}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center gap-1 ${
            isOverdue
              ? "text-destructive font-semibold"
              : isSoon
                ? "text-amber-600 font-medium"
                : ""
          }`}
        >
          {item.next_due_date ? formatDate(item.next_due_date) : "—"}
          {isOverdue && <AlertCircle className="size-4" />}
        </span>
      </TableCell>
      <TableCell>
        {item.reminder_enabled ? (
          <Bell className="size-4 text-green-600" />
        ) : (
          <BellOff className="size-4 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function ServiceRemindersPage() {
  const t = useTranslations();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data: schedules = [],
    isLoading,
    error,
    refetch,
  } = useServiceSchedules(orgId);

  const createSchedule = useCreateServiceSchedule(orgId);
  const deleteSchedule = useDeleteServiceSchedule(orgId);

  const [showAdd, setShowAdd] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    vehicle_id: "",
    service_catalog_id: "",
    service_name: "",
    interval_months: "",
    interval_km: "",
    last_service_date: "",
    last_service_odometer: "",
    next_due_date: "",
    notes: "",
  });
  const [addTab, setAddTab] = useState<"schedule" | "logs">("schedule");
  const [showConfig, setShowConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  const { settings: orgSettings } = useOrgSettings(orgId);
  const updateOrgSettings = useUpdateOrgSettings(orgId);

  const defaultChannel = (orgSettings?.reminder_default_channel as string) ?? "in_app";
  const autoEnable = orgSettings?.reminder_auto_enable !== false;

  const [configChannel, setConfigChannel] = useState(defaultChannel);
  const [configAutoEnable, setConfigAutoEnable] = useState(autoEnable);

  // Sync state when org settings load
  const configSynced = useRef(false);
  if (orgSettings && !configSynced.current) {
    setConfigChannel((orgSettings?.reminder_default_channel as string) ?? "in_app");
    setConfigAutoEnable(orgSettings?.reminder_auto_enable !== false);
    configSynced.current = true;
  }

  const handleSaveConfig = async () => {
    await updateOrgSettings.mutateAsync({
      reminder_default_channel: configChannel,
      reminder_auto_enable: configAutoEnable,
    });
    setShowConfig(false);
  };

  const handleAdd = async () => {
    if (!orgId || !newSchedule.service_name.trim()) {
      toast.error(t("common.noResults"));
      return;
    }

    try {
      await createSchedule.mutateAsync({
        vehicle_id: newSchedule.vehicle_id || undefined,
        service_catalog_id:
          newSchedule.service_catalog_id || undefined,
        service_name: newSchedule.service_name.trim(),
        interval_months: newSchedule.interval_months
          ? parseInt(newSchedule.interval_months, 10)
          : null,
        interval_km: newSchedule.interval_km
          ? parseInt(newSchedule.interval_km, 10)
          : null,
        last_service_date:
          newSchedule.last_service_date || null,
        last_service_odometer: newSchedule.last_service_odometer
          ? parseInt(newSchedule.last_service_odometer, 10)
          : null,
        next_due_date: newSchedule.next_due_date || null,
      });

      setShowAdd(false);
      setNewSchedule({
        vehicle_id: "",
        service_catalog_id: "",
        service_name: "",
        interval_months: "",
        interval_km: "",
        last_service_date: "",
        last_service_odometer: "",
        next_due_date: "",
        notes: "",
      });
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create schedule",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      await deleteSchedule.mutateAsync(id);
      toast.success(t("common.deleted"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete schedule",
      );
    }
  };

  const listError = error ? error.message : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("serviceReminders.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("serviceReminders.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              if (!orgId) return;
              setSyncing(true);
              try {
                const res = await fetch(
                  `/api/organizations/${orgId}/service-reminders/sync-history`,
                  { method: "POST" },
                );
                const json = await res.json();
                if (json.error) throw new Error(json.error.message);
                toast.success(`Synced ${json.data.synced} service(s)`);
                refetch();
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to sync history",
                );
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            title="Sync from work order history"
          >
            <History className={`size-4 ${syncing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              if (!orgId) return;
              setSending(true);
              try {
                const res = await fetch(
                  `/api/organizations/${orgId}/service-reminders/send-pending`,
                  { method: "POST" },
                );
                const json = await res.json();
                if (json.error) throw new Error(json.error.message);
                toast.success(`Sent ${json.data.sent} reminder(s)`);
                refetch();
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Failed to send",
                );
              } finally {
                setSending(false);
              }
            }}
            disabled={sending}
            title="Send pending reminders"
          >
            <Send className={`size-4 ${sending ? "animate-spin" : ""}`} />
          </Button>
          <Sheet open={showConfig} onOpenChange={setShowConfig}>
            <SheetTrigger render={<Button variant="outline" size="icon"><Settings className="size-4" /></Button>} />
            <SheetContent side="right" className="w-80 sm:w-96">
              <SheetHeader>
                <SheetTitle>{t("serviceReminders.configTitle")}</SheetTitle>
                <SheetDescription>
                  {t("serviceReminders.configDescription")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="default-channel">
                    {t("serviceReminders.defaultChannel")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("serviceReminders.defaultChannelDescription")}
                  </p>
                  <Select
                    value={configChannel}
                    onValueChange={(v) => v && setConfigChannel(v)}
                  >
                    <SelectTrigger id="default-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">
                        {t("serviceReminders.channelInApp")}
                      </SelectItem>
                      <SelectItem value="email">
                        {t("serviceReminders.channelEmail")}
                      </SelectItem>
                      <SelectItem value="both">
                        {t("serviceReminders.channelBoth")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      {t("serviceReminders.autoEnable")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("serviceReminders.autoEnableDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={configAutoEnable}
                    onCheckedChange={setConfigAutoEnable}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveConfig}
                  disabled={updateOrgSettings.isPending}
                >
                  {updateOrgSettings.isPending
                    ? t("common.saving")
                    : t("common.save")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger render={<Button><Plus className="mr-2 size-4" />{t("serviceReminders.addSchedule")}</Button>} />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t("serviceReminders.addNewSchedule")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="service_name">
                    {t("serviceReminders.serviceName")}
                  </Label>
                  <Input
                    id="service_name"
                    value={newSchedule.service_name}
                    onChange={(e) =>
                      setNewSchedule((p) => ({
                        ...p,
                        service_name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Oil Change"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="interval_months">
                      {t("serviceReminders.intervalMonths")}
                    </Label>
                    <Input
                      id="interval_months"
                      type="number"
                      value={newSchedule.interval_months}
                      onChange={(e) =>
                        setNewSchedule((p) => ({
                          ...p,
                          interval_months: e.target.value,
                        }))
                      }
                      placeholder="6"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interval_km">
                      {t("serviceReminders.intervalKm")}
                    </Label>
                    <Input
                      id="interval_km"
                      type="number"
                      value={newSchedule.interval_km}
                      onChange={(e) =>
                        setNewSchedule((p) => ({
                          ...p,
                          interval_km: e.target.value,
                        }))
                      }
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="last_service_date">
                      {t("serviceReminders.lastServiceDate")}
                    </Label>
                    <Input
                      id="last_service_date"
                      type="date"
                      value={newSchedule.last_service_date}
                      onChange={(e) =>
                        setNewSchedule((p) => ({
                          ...p,
                          last_service_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="next_due_date">
                      {t("serviceReminders.nextDueDate")}
                    </Label>
                    <Input
                      id="next_due_date"
                      type="date"
                      value={newSchedule.next_due_date}
                      onChange={(e) =>
                        setNewSchedule((p) => ({
                          ...p,
                          next_due_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdd(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAdd} disabled={createSchedule.isPending}>
                  {createSchedule.isPending
                    ? t("serviceReminders.saving")
                    : t("serviceReminders.saveSchedule")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        value={addTab}
        onValueChange={(v) => setAddTab(v as "schedule" | "logs")}
      >
        <TabsList>
          <TabsTrigger value="schedule">
            {t("serviceReminders.scheduleList")}
          </TabsTrigger>
          <TabsTrigger value="logs">
            {t("serviceReminders.reminderLogs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`skel-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : listError ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <p className="text-destructive">{listError}</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
                  <Calendar className="size-8" />
                  <p>{t("serviceReminders.noSchedules")}</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdd(true)}
                  >
                    <Plus className="mr-2 size-4" />
                    {t("serviceReminders.addSchedule")}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("serviceReminders.vehicle")}
                      </TableHead>
                      <TableHead>
                        {t("serviceReminders.serviceName")}
                      </TableHead>
                      <TableHead>Interval</TableHead>
                      <TableHead>
                        {t("serviceReminders.lastServiceDate")}
                      </TableHead>
                      <TableHead>
                        {t("serviceReminders.nextDueDate")}
                      </TableHead>
                      <TableHead>
                        {t("serviceReminders.reminderEnabled")}
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((item) => (
                      <ScheduleRow
                        key={item.id}
                        item={item}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <ReminderLogsTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReminderLogsTab({ orgId }: { orgId: string | undefined }) {
  const t = useTranslations();
  const { data: logs, isLoading, error, refetch } = useReminderLogs(orgId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <p className="text-destructive">{error.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
          <Bell className="size-8" />
          <p>{t("serviceReminders.noLogs")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>{t("serviceReminders.serviceName")}</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.vehicle
                    ? `${log.vehicle.make} ${log.vehicle.model} ${log.vehicle.plate_number}`
                    : "—"}
                </TableCell>
                <TableCell>{log.service_name}</TableCell>
                <TableCell>
                  <StatusBadge status={log.reminder_type} />
                </TableCell>
                <TableCell>
                  <ChannelBadge channel={log.channel} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.status} />
                </TableCell>
                <TableCell>{formatDate(log.scheduled_at)}</TableCell>
                <TableCell>
                  {log.sent_at ? formatDate(log.sent_at) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    service_due: "bg-blue-100 text-blue-800",
    service_overdue: "bg-orange-100 text-orange-800",
    custom: "bg-purple-100 text-purple-800",
  };

  const labels: Record<string, string> = {
    pending: t("serviceReminders.statusPending"),
    sent: t("serviceReminders.statusSent"),
    failed: t("serviceReminders.statusFailed"),
    cancelled: t("serviceReminders.statusCancelled"),
    service_due: t("serviceReminders.typeServiceDue"),
    service_overdue: t("serviceReminders.typeServiceOverdue"),
    custom: t("serviceReminders.typeCustom"),
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const t = useTranslations();
  const labels: Record<string, string> = {
    email: t("serviceReminders.channelEmail"),
    both: t("serviceReminders.channelBoth"),
    in_app: t("serviceReminders.channelInApp"),
  };

  return (
    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
      {labels[channel] ?? channel}
    </span>
  );
}
