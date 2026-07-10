"use client";

import { useQuery } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { InvoiceCreateDrawer } from "@/components/invoices/invoice-create-drawer";
import { createClient } from "@/lib/supabase/client";

export function QuickCreateInvoiceWrapper({
  organizationId,
  onClose,
}: {
  organizationId: string;
  onClose: () => void;
}) {
  const supabase = createClient();

  const { data: contacts } = useQuery({
    queryKey: ["quick-create", "contacts", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("type", "customer")
        .order("name");
      if (error)
        capture(error, { context: "[quick-create-invoice] contacts query" });
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["quick-create", "products", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name");
      if (error)
        capture(error, { context: "[quick-create-invoice] products query" });
      return data ?? [];
    },
  });

  if (!contacts || !products) return null;

  return (
    <InvoiceCreateDrawer
      contacts={contacts}
      products={products}
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
}
