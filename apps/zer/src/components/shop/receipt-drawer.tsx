"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import {
  ReceiptContent,
  type SaleData,
  type SaleItem,
} from "@/components/shop/receipt-content";
import { saleKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@zuiio/capture";

export interface ReceiptDrawerProps {
  saleId: string;
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReceiptData = {
  organizationName: string;
  sale: SaleData;
  items: SaleItem[];
};

export function ReceiptDrawer({
  saleId,
  orgId,
  open,
  onOpenChange,
}: ReceiptDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: saleKeys.detail(saleId),
    enabled: open,
    queryFn: async (): Promise<ReceiptData> => {
      const supabase = createClient();

      try {
        const [orgResult, saleResult, itemsResult] = await Promise.all([
          supabase.from("organizations").select("name").eq("id", orgId).single(),
          supabase
            .from("sales")
            .select(
              "id, total_amount, paid_amount, payment_method, status, sale_date, created_at, contact_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name)",
            )
            .eq("organization_id", orgId)
            .eq("id", saleId)
            .single(),
          supabase
            .from("sale_items")
            .select(
              "id, quantity, unit_price, total_price, product_id, products(name, unit)",
            )
            .eq("sale_id", saleId)
            .order("id", { ascending: true }),
        ]);

        if (!saleResult.data) {
          throw new Error("Sale not found");
        }

        return {
          organizationName: orgResult.data?.name ?? "Дэлгүүр",
          sale: saleResult.data as unknown as SaleData,
          items: (itemsResult.data ?? []) as SaleItem[],
        };
      } catch (error) {
        capture(error);
        throw error;
      }
    },
  });

  // Auto-close after 4s once data is loaded (sale is already completed)
  useEffect(() => {
    if (!data || !open) return;
    const timer = setTimeout(() => {
      onOpenChange(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [data, open, onOpenChange]);

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Баримт"
      description={saleId ? `#${saleId.slice(0, 8).toUpperCase()}` : undefined}
      panelWidth="28rem"
    >
      <ReceiptContent />
    </SlideInDrawer>
  );
}
