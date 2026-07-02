"use client";

import { History, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  orgId: string | undefined;
  onSyncComplete?: () => void;
  onSendComplete?: () => void;
}

export function ActionButtons({
  orgId,
  onSyncComplete,
  onSendComplete,
}: ActionButtonsProps) {
  const t = useTranslations();
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSync = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/service-reminders/sync-history`,
        { method: "POST" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.dismiss();
      toast.success(t("serviceReminders.synced", { count: json.data.synced }));
      onSyncComplete?.();
    } catch (err) {
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : t("serviceReminders.failedToSync"),
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!orgId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/service-reminders/send-pending`,
        { method: "POST" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.dismiss();
      toast.success(
        t("serviceReminders.sentReminders", { count: json.data.sent }),
      );
      onSendComplete?.();
    } catch (err) {
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : t("serviceReminders.failedToSend"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing || !orgId}
      >
        <History className={`size-4 ${syncing ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline ml-1.5">
          {t("serviceReminders.syncFromHistory")}
        </span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSend}
        disabled={sending || !orgId}
      >
        <Send className={`size-4 ${sending ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline ml-1.5">
          {t("serviceReminders.sendPendingReminders")}
        </span>
      </Button>
    </>
  );
}
