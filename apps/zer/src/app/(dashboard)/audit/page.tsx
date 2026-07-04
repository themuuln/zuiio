import { redirect } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { AuditContent } from "./audit-content";



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
  if (!(await checkOrgSetting(supabase, organizationId, "has_audit_log")))
    redirect("/");

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
      <AuditContent rows={rows} />
    </PageShell>
  );
}
