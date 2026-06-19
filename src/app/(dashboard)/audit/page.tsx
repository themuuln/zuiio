import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/erp";
import { formatDate } from "@/lib/format";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableBuildValidation: true,
};

const ACTION_LABELS: Record<string, string> = {
  created: "Үүсгэсэн",
  updated: "Зассан",
  deleted: "Устгасан",
  status_changed: "Төлөв өөрчлөгдсөн",
  shared: "Хуваалцсан",
  payment_received: "Төлбөр хүлээн авсан",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: "Бүтээгдэхүүн",
  sale: "Борлуулалт",
  expense: "Зарлага",
  contact: "Харилцагч",
  invoice: "Нэхэмжлэл",
  category: "Ангилал",
  stock_movement: "Барааны хөдөлгөөн",
  warehouse: "Агуулах",
  brand: "Брэнд",
};

export type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  summary: string | null;
  created_at: string | null;
  actor_name: string | null;
};

export default async function AuditLogPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, summary, created_at, profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: AuditLogRow[] = (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    entity_type: log.entity_type,
    summary: log.summary,
    created_at: log.created_at,
    actor_name:
      (log.profiles as { full_name: string | null } | null)?.full_name ??
      "Систем",
  }));

  return (
    <PageShell
      title="Үйлдлийн түүх"
      description="Систем дэх бүх үйлдлийн бүртгэл"
    >
      <Card>
        <CardHeader>
          <CardTitle>Сүүлийн 100 үйлдэл</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 pb-6 pt-2">
              <p className="text-sm text-muted-foreground">
                Үйлдлийн түүх байхгүй байна.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Хэрэглэгч</TableHead>
                  <TableHead>Үйлдэл</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Тайлбар</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.created_at ? formatDate(row.created_at) : "-"}
                    </TableCell>
                    <TableCell>{row.actor_name}</TableCell>
                    <TableCell>
                      {ACTION_LABELS[row.action] ?? row.action}
                    </TableCell>
                    <TableCell>
                      {ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.summary ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
