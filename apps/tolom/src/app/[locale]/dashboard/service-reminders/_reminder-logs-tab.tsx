"use client";

import { Bell, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useReminderLogs } from "@/lib/queries/use-service-reminders";
import { ChannelBadge, StatusBadge } from "./_badges";
import { formatDate, formatVehicleLabel } from "./_utils";

interface ReminderLogsTabProps {
  orgId: string | undefined;
  branchFilter: string | null;
}

export function ReminderLogsTab({ orgId, branchFilter }: ReminderLogsTabProps) {
  const t = useTranslations();
  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useReminderLogs(orgId, undefined, branchFilter);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        formatVehicleLabel(log.vehicle)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        log.service_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        !statusFilter || statusFilter === "all" || log.status === statusFilter;
      const matchesChannel =
        !channelFilter ||
        channelFilter === "all" ||
        log.channel === channelFilter;
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [logs, search, statusFilter, channelFilter]);

  const hasFilters =
    search ||
    (statusFilter && statusFilter !== "all") ||
    (channelFilter && channelFilter !== "all");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="h-10 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <Typography.Text className="text-destructive">
            {error.message}
          </Typography.Text>
          <Button variant="outline" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell />
          </EmptyMedia>
          <EmptyTitle>{t("serviceReminders.noLogs")}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("serviceReminders.searchLogs")}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v: string | null) => setStatusFilter(v || "all")}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder={t("serviceReminders.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("serviceReminders.filterAll")}
            </SelectItem>
            <SelectItem value="pending">
              {t("serviceReminders.statusPending")}
            </SelectItem>
            <SelectItem value="sent">
              {t("serviceReminders.statusSent")}
            </SelectItem>
            <SelectItem value="failed">
              {t("serviceReminders.statusFailed")}
            </SelectItem>
            <SelectItem value="cancelled">
              {t("serviceReminders.statusCancelled")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={channelFilter}
          onValueChange={(v: string | null) => setChannelFilter(v || "all")}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder={t("serviceReminders.filterByChannel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("serviceReminders.filterAll")}
            </SelectItem>
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
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setChannelFilter("all");
            }}
          >
            <X className="size-3 mr-1" />
            {t("serviceReminders.clearFilters")}
          </Button>
        )}
      </div>

      {/* Results */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Typography.Muted>
              {t("serviceReminders.noMatchingLogs")}
            </Typography.Muted>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setChannelFilter("all");
                }}
              >
                {t("serviceReminders.clearFilters")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("serviceReminders.vehicle")}</TableHead>
                  <TableHead>{t("serviceReminders.serviceName")}</TableHead>
                  <TableHead>{t("serviceReminders.type")}</TableHead>
                  <TableHead>{t("serviceReminders.channel")}</TableHead>
                  <TableHead>{t("serviceReminders.status")}</TableHead>
                  <TableHead>{t("serviceReminders.scheduled")}</TableHead>
                  <TableHead>{t("serviceReminders.sentAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {formatVehicleLabel(log.vehicle)}
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
                    <TableCell className="text-sm">
                      {formatDate(log.scheduled_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.sent_at ? formatDate(log.sent_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
