"use client";

import { useQuery } from "@tanstack/react-query";
import { SalesCreateDrawer } from "@/components/sales/sales-create-drawer";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@zuiio/capture";

export function QuickCreateSaleWrapper({
  organizationId,
  onClose,
}: {
  organizationId: string;
  onClose: () => void;
}) {
  const supabase = createClient();

  const { data: products } = useQuery({
    queryKey: ["quick-create", "products", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit, barcode, image_url")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name");
      if (error) capture(error, { context: "[quick-create-sale] products query" });
      return data ?? [];
    },
  });

  if (!products) return null;

  return (
    <SalesCreateDrawer
      products={products}
      open={true}
      onOpenChangeAction={(open) => {
        if (!open) onClose();
      }}
    />
  );
}
