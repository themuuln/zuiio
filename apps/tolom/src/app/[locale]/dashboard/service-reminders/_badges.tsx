"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { DueStatus } from "./_utils";

const STATUS_BADGE_VARIANT: Record<
  string,
  "destructive" | "secondary" | "outline"
> = {
  pending: "outline",
  sent: "secondary",
  failed: "destructive",
  cancelled: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "serviceReminders.statusPending",
  sent: "serviceReminders.statusSent",
  failed: "serviceReminders.statusFailed",
  cancelled: "serviceReminders.statusCancelled",
  service_due: "serviceReminders.typeServiceDue",
  service_overdue: "serviceReminders.typeServiceOverdue",
  custom: "serviceReminders.typeCustom",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const key = STATUS_LABELS[status];
  const variant = STATUS_BADGE_VARIANT[status] ?? "outline";
  return <Badge variant={variant}>{key ? t(key) : status}</Badge>;
}

const CHANNEL_LABELS: Record<string, string> = {
  email: "serviceReminders.channelEmail",
  both: "serviceReminders.channelBoth",
  in_app: "serviceReminders.channelInApp",
};

export function ChannelBadge({ channel }: { channel: string }) {
  const t = useTranslations();
  const key = CHANNEL_LABELS[channel];
  return <Badge variant="outline">{key ? t(key) : channel}</Badge>;
}

const DUE_STATUS_CONFIG: Record<
  DueStatus,
  { labelKey: string; variant: "destructive" | "secondary" | "outline" }
> = {
  overdue: {
    labelKey: "serviceReminders.statusOverdue",
    variant: "destructive",
  },
  "due-soon": {
    labelKey: "serviceReminders.statusDueSoon",
    variant: "secondary",
  },
  scheduled: {
    labelKey: "serviceReminders.statusScheduled",
    variant: "outline",
  },
  "no-date": { labelKey: "serviceReminders.statusNoDate", variant: "outline" },
};

export function DueStatusBadge({ status }: { status: DueStatus }) {
  const t = useTranslations();
  const config = DUE_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>;
}
