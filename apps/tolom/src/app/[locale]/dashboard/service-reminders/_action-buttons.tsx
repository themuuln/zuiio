"use client";

import { useOrgMutation } from "@zuiio/query";
import { History, Send } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;

  const syncMutation = useOrgMutation<{ data: { synced: number } }, void>({
    endpoint: `/api/organizations/${orgId}/service-reminders/sync-history`,
    method: "POST",
    queryKey: ["organizations", orgId, "service-reminders"],
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(t("serviceReminders.synced", { count: data.data.synced }));
      onSyncComplete?.();
    },
  });

  const sendMutation = useOrgMutation<{ data: { sent: number } }, void>({
    endpoint: `/api/organizations/${orgId}/service-reminders/send-pending`,
    method: "POST",
    queryKey: ["organizations", orgId, "service-reminders"],
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(
        t("serviceReminders.sentReminders", { count: data.data.sent }),
      );
      onSendComplete?.();
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending || !orgId}
      >
        <History
          className={`size-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline ml-1.5">
          {t("serviceReminders.syncFromHistory")}
        </span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => sendMutation.mutate()}
        disabled={sendMutation.isPending || !orgId}
      >
        <Send
          className={`size-4 ${sendMutation.isPending ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline ml-1.5">
          {t("serviceReminders.sendPendingReminders")}
        </span>
      </Button>
    </>
  );
}
