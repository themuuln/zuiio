import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import WarehousesPage from "./warehouses-client";

export default async function Page() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");
  return <WarehousesPage />;
}
