"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { PurchaseCreateDrawer } from "@/components/purchases/purchase-create-drawer";
import type { PurchaseRow } from "./purchases-table";
import { PurchasesTable } from "./purchases-table";

type SupplierOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

export function PurchasesContent({
  purchaseOrders,
  suppliers,
  products,
}: {
  purchaseOrders: PurchaseRow[];
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/purchases");
    }
  }, []);

  const handleCreateSuccess = () => {
    router.refresh();
  };

  return (
    <PageShell
      title="Худалдан авалт"
      description="Нийлүүлэгчээс бараа материалын худалдан авалтын захиалга"
    >
      {!purchaseOrders.length ? (
        <ErpEmptyState
          icon={<ShoppingCart className="size-4" />}
          title="Худалдан авалтын захиалга байхгүй"
          description="Шинэ захиалга үүсгэж, нийлүүлэгчээс бараа захиалах."
          action={
            <PurchaseCreateDrawer
              suppliers={suppliers}
              products={products}
              open={createOpen}
              onOpenChange={setCreateOpen}
              onSuccess={handleCreateSuccess}
            />
          }
        />
      ) : (
        <PurchasesTable
          data={purchaseOrders}
          toolbar={
            <>
              <ExportButton
                href="/api/export/purchases"
                filename={`purchases-${new Date().toISOString().slice(0, 10)}.csv`}
              />
              <PurchaseCreateDrawer
                suppliers={suppliers}
                products={products}
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={handleCreateSuccess}
              />
            </>
          }
        />
      )}
    </PageShell>
  );
}
