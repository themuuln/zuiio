import { redirect } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { BranchesContent } from "./branches-content";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export default async function BranchesPage() {
  const { supabase, organizationId, permissions } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_multi_branch")))
    redirect("/");

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
