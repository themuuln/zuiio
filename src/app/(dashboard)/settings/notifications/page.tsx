import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";

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

export default async function NotificationsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PageShell
      title="Мэдэгдлийн түүх"
      description="Илгээгдсэн мэдэгдлүүдийн бүртгэл"
    >
      {!notifications || notifications.length === 0 ? (
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
                  className="flex items-start justify-between px-6 py-4 gap-4"
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
                      <span>{EVENT_LABELS[n.event_type] ?? n.event_type}</span>
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
                    <p className="text-xs text-destructive shrink-0 max-w-[200px] truncate">
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
