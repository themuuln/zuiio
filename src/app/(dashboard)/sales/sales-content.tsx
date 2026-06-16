"use client";

import { Receipt } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesCreateDrawer } from "@/components/sales/sales-create-drawer";
import { type SaleRow, SalesTable } from "./sales-table";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export function SalesContent({
  sales,
  products,
  customers,
}: {
  sales: SaleRow[];
  products: ProductOption[];
  customers: CustomerOption[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/sales");
    }
  }, []);

  return (
    <PageShell
      title="Борлуулалт"
      description="Борлуулалтын жагсаалт, статус, төлбөрийн мэдээлэл."
      actions={
        <>
          <ExportButton
            href="/api/export/sales"
            filename={`sales-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <SalesCreateDrawer
            products={products}
            customers={customers}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </>
      }
    >
      {!sales.length ? (
        <ErpEmptyState
          icon={<Receipt className="size-4" />}
          title="Борлуулалт бүртгэгдээгүй"
          description="Шинэ борлуулалт үүсгэж, борлуулалтын мэдээллээ хянана уу."
          action={
            <SalesCreateDrawer
              products={products}
              customers={customers}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Борлуулалтын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTable data={sales} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
