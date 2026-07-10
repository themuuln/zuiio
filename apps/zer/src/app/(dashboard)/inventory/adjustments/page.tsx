import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { AdjustmentsContent } from "./adjustments-content";

export default async function AdjustmentsPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  return <AdjustmentsContent />;
}
