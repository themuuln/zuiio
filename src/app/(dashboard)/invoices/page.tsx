import { requireAppContext } from "@/lib/erp";
import { InvoicesContent } from "./invoices-content";

export const unstable_instant = { prefetch: "static" };

export default async function InvoicesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [{ data: invoices }, { data: contacts }, { data: products }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, issue_date, due_date, total_amount, paid_amount, status, contacts(name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("type", "customer")
      .order("name"),
    supabase
      .from("products")
      .select("id, name, sale_price, current_stock, unit")
      .eq("organization_id", organizationId)
      .order("name"),
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
