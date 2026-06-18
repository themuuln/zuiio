import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { BranchesContent } from "./branches-content";

export const unstable_instant = { prefetch: "static" };

export default async function BranchesPage() {
  const { supabase, organizationId, permissions } = await requireAppContext();

  const canManage = permissions.includes("settings.manage");

  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  const allBranches = branches ?? [];

  return (
    <PageShell
      title="Салбарууд"
      description="Байгууллагын салбаруудын бүртгэл, удирдлага"
    >
      <Card>
        <CardHeader>
          <CardTitle>Салбарын жагсаалт</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BranchesContent branches={allBranches} canManage={canManage} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
