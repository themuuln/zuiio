import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { CommissionContent } from "./commission-content";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableBuildValidation: true,
};

export default async function CommissionsPage() {
  const { organizationId } = await requireAppContext();

  return (
    <PageShell
      title="Комисс"
      description="Ажилтнуудын комиссын мэдээлэл, төлөлт болон түүх."
    >
      <CommissionContent orgId={organizationId} />
    </PageShell>
  );
}
