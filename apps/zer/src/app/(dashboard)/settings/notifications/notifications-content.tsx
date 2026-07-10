"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useOrgSettings } from "@/lib/org-settings-context";

const EVENT_LABELS: Record<string, string> = {
  low_stock: "Бага нөөц",
  new_sale: "Шинэ борлуулалт",
  daily_summary: "Өдрийн тойм",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sent: "default",
  pending: "secondary",
  failed: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Амжилттай",
  pending: "Хүлээгдэж буй",
  failed: "Амжилтгүй",
};

type NotificationRow = {
  id: string;
  title: string | null;
  status: string | null;
  message: string | null;
  event_type: string | null;
  created_at: string | null;
  error_message: string | null;
};

export function NotificationsContent() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["notifications", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:notifications",
        supabase
          .from("notifications")
          .select(
            "id, title, status, message, event_type, created_at, error_message",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(50),
      );
      if (error) throw error;
      return data as NotificationRow[];
    },
    enabled: !!organizationId,
  });

  const notifications = query.data ?? [];
  const isLoading = query.isLoading || query.isFetching;

  return (
    <PageShell
      title="Мэдэгдлийн түүх"
      description="Илгээгдсэн мэдэгдлүүдийн бүртгэл"
    >
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : notifications.length === 0 ? (
        <ErpEmptyState
          icon={<PaperPlaneTilt className="size-4" />}
          title="Мэдэгдэл байхгүй"
          description="Одоогоор илгээгдсэн мэдэгдэл байхгүй байна."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-wrap items-start justify-between px-6 py-4 gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      <Badge
                        variant={STATUS_VARIANTS[n.status ?? "pending"]}
                        className="text-[10px] leading-relaxed"
                      >
                        {STATUS_LABELS[n.status ?? "pending"]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{EVENT_LABELS[n.event_type ?? ""] ?? n.event_type}</span>
                      <span>&middot;</span>
                      <span>
                        {new Date(n.created_at ?? "").toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  {n.status === "failed" && n.error_message && (
                    <p className="w-full text-xs text-destructive sm:w-auto sm:max-w-[200px]">
                      {n.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
