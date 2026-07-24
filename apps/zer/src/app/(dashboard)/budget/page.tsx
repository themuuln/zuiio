import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { BudgetContent } from "./budget-content";

export default async function BudgetPage() {
  const { organizationId } = await requireAppContext();
  return (
    <PageShell title="Төсөв" description="Байгууллагын төсөв удирдах">
      <BudgetContent orgId={organizationId} />
    </PageShell>
  );
}
