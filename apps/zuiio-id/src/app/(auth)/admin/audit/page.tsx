import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { AuditLogList } from "./audit-list";

export const metadata: Metadata = {
  title: "Аудит лог — Zuiio ID админ",
};

export default async function AdminAuditPage() {
  const admin = await createAdminClient();

  const { data: events } = await admin
    .from("sso_audit_events")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Аудит лог</h2>
        <p className="text-sm text-muted-foreground">
          Сүүлийн үйлдлүүд ({events?.length ?? 0})
        </p>
      </div>
      <AuditLogList events={events ?? []} />
    </div>
  );
}
