import { ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
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
      <ErpDataTable
        title="Сүүлийн 100 үйлдэл"
        columns={[
          {
            header: "Огноо",
            accessor: (row: AuditLogRow) =>
              row.created_at ? formatDate(row.created_at) : "-",
            cellClassName: "whitespace-nowrap",
          },
          {
            header: "Хэрэглэгч",
            accessor: (row: AuditLogRow) => row.actor_name,
          },
          {
            header: "Үйлдэл",
            accessor: (row: AuditLogRow) =>
              ACTION_LABELS[row.action] ?? row.action,
          },
          {
            header: "Төрөл",
            accessor: (row: AuditLogRow) =>
              ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type,
          },
          {
            header: "Тайлбар",
            accessor: (row: AuditLogRow) => (
              <span className="text-muted-foreground">
                {row.summary ?? "-"}
              </span>
            ),
          },
        ]}
        data={rows}
        keyExtractor={(row) => row.id}
        emptyState={{
          title: "Үйлдлийн түүх байхгүй",
          description: "Системд одоогоор бүртгэгдсэн үйлдэл байхгүй байна.",
        }}
      />
    </PageShell>
  );
}
