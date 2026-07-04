import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { QuotationsContent } from "./quotations-content";

export type QuotationRow = {
  id: string;
  quote_number: string;
  issue_date: string;
  expiry_date: string | null;
  contact_name: string | null;
  total_amount: number;
  status: string;
  created_at: string | null;
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: urlBranch } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const [quotationsResult, productsResult, customersResult] = await Promise.all(
    [
      withBranchFilter(
        supabase
          .from("quotations")
          .select(
            "id, quote_number, issue_date, expiry_date, total_amount, status, created_at, contacts(name)",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
        branchId,
        isBranchScoped,
        urlBranch,
      ),
      supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("type", "customer")
        .order("name"),
    ],
  );

  const quotations: QuotationRow[] =
    (quotationsResult.data ?? []).map((q) => ({
      id: q.id,
      quote_number: q.quote_number,
      issue_date: q.issue_date,
      expiry_date: q.expiry_date,
      contact_name: (q.contacts as { name: string } | null)?.name ?? null,
      total_amount: q.total_amount,
      status: q.status,
      created_at: q.created_at,
    })) ?? [];

  return (
    <QuotationsContent
      quotations={quotations}
      products={productsResult.data ?? []}
      customers={customersResult.data ?? []}
    />
  );
}
