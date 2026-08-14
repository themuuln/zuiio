import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { LoyaltyContent } from "./loyalty-content";

export default async function LoyaltyPage() {
  const { organizationId } = await requireAppContext();
  return (
    <PageShell
      title="Лоялти хөтөлбөр"
      description="Үнэнч хэрэглэгчийн онооны систем"
    >
      <LoyaltyContent orgId={organizationId} />
    </PageShell>
  );
}
