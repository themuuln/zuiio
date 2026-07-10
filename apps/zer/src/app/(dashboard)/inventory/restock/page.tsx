import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { RestockContent } from "./restock-content";

export default async function RestockPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  return <RestockContent />;
}
