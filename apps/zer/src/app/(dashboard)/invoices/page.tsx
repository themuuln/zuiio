import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { InvoicesContent } from "./invoices-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher({
  searchParams,
}: {
  searchParams: { branch?: string };
}) {
  const { branch: urlBranch } = searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const [{ data: invoices }, { data: contacts }, { data: products }] =
    await Promise.all([
      withDbCapture(
        "page:invoices:invoices",
        withBranchFilter(
          supabase
            .from("invoices")
            .select(
              "id, invoice_number, issue_date, due_date, total_amount, paid_amount, status, contacts(name)",
            )
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(500),
          branchId,
          isBranchScoped,
          urlBranch,
        ),
      ),
      withDbCapture(
        "page:invoices:contacts",
        supabase
          .from("contacts")
          .select("id, name")
          .eq("organization_id", organizationId)
          .eq("type", "customer")
          .order("name"),
      ),
      withDbCapture(
        "page:invoices:products",
        supabase
          .from("products")
          .select("id, name, sale_price, current_stock, unit")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name"),
      ),
    ]);

  const invoiceRows = (invoices ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    contact_name: (inv.contacts as { name: string } | null)?.name ?? null,
    total_amount: inv.total_amount ?? 0,
    paid_amount: inv.paid_amount ?? 0,
    status: inv.status,
  }));

  return (
    <InvoicesContent
      invoiceRows={invoiceRows}
      contacts={contacts ?? []}
      products={products ?? []}
    />
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher searchParams={await searchParams} />
    </Suspense>
  );
}
