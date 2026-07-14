"use client";

import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Column, ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
import { ReturnCreateDrawer } from "@/components/returns/return-create-drawer";
import { ReturnDetailDrawer } from "@/components/returns/return-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchContext } from "@/lib/branch-context";
import { withBranchFilter } from "@/lib/branches";
import { formatCurrency, formatDate } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { returnKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import type { ReturnRow } from "./page";

type ContactOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type SaleOption = {
  id: string;
  sale_date: string;
  total_amount: number | null;
  contacts: { name: string | null } | null;
};

type PurchaseOrderOption = {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number | null;
  contacts: { name: string | null } | null;
};

type QueryData = {
  returns: ReturnRow[];
  contacts: ContactOption[];
  products: ProductOption[];
  sales: SaleOption[];
  purchaseOrders: PurchaseOrderOption[];
};

const typeLabels: Record<string, string> = {
  sales_return: "Борлуулалтын буцаалт",
  purchase_return: "Худалдан авалтын буцаалт",
};

const statusLabels: Record<string, string> = {
  draft: "Ноорог",
  completed: "Гүйцэтгэсэн",
  cancelled: "Цуцлагдсан",
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "draft":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

const columns: Column<ReturnRow>[] = [
  {
    header: "Дугаар",
    accessor: (row) => row.return_number,
    cellClassName: "font-medium",
  },
  {
    header: "Огноо",
    accessor: (row) => formatDate(row.return_date),
  },
  {
    header: "Төрөл",
    accessor: (row) => typeLabels[row.type] ?? row.type,
  },
  {
    header: "Харилцагч",
    accessor: (row) => row.contact_name ?? "-",
  },
  {
    header: "Нийт дүн",
    accessor: (row) => formatCurrency(row.total_amount),
    cellClassName: "text-right",
  },
  {
    header: "Статус",
    accessor: (row) => {
      return (
        <Badge variant={statusBadgeVariant(row.status)}>
          {statusLabels[row.status] ?? row.status}
        </Badge>
      );
    },
  },
];

export function ReturnsContent() {
  const searchParams = useSearchParams();
  const urlBranch = searchParams.get("branch") ?? undefined;
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/returns");
    }
  }, []);

  const { organizationId } = useOrgSettings();
  const { selectedBranchId, isBranchScoped } = useBranchContext();

  const query = useQuery({
    queryKey: returnKeys.lists(organizationId),
    queryFn: async (): Promise<QueryData> => {
      const supabase = createClient();

      const [
        returnsResult,
        contactsResult,
        productsResult,
        salesResult,
        purchaseOrdersResult,
      ] = await Promise.all([
        withDbCapture(
          "page:returns",
          withBranchFilter(
            supabase
              .from("returns")
              .select(
                "id, return_number, return_date, type, reference_type, reference_id, contact_id, status, total_amount, reason, contacts(name)",
              )
              .eq("organization_id", organizationId)
              .order("created_at", { ascending: false }),
            selectedBranchId,
            isBranchScoped,
            urlBranch,
          ),
        ),
        withDbCapture(
          "page:returns",
          supabase
            .from("contacts")
            .select("id, name")
            .eq("organization_id", organizationId)
            .order("name"),
        ),
        withDbCapture(
          "page:returns",
          supabase
            .from("products")
            .select("id, name, sale_price, current_stock, unit")
            .eq("organization_id", organizationId)
            .is("deleted_at", null)
            .order("name"),
        ),
        withDbCapture(
          "page:returns",
          withBranchFilter(
            supabase
              .from("sales")
              .select("id, sale_date, total_amount, contacts(name)")
              .eq("organization_id", organizationId)
              .order("sale_date", { ascending: false })
              .limit(100),
            selectedBranchId,
            isBranchScoped,
            urlBranch,
          ),
        ),
        withDbCapture(
          "page:returns",
          withBranchFilter(
            supabase
              .from("purchase_orders")
              .select(
                "id, order_number, order_date, total_amount, contacts!purchase_orders_supplier_id_fkey(name)",
              )
              .eq("organization_id", organizationId)
              .order("order_date", { ascending: false })
              .limit(100),
            selectedBranchId,
            isBranchScoped,
            urlBranch,
          ),
        ),
      ]);

      const returns: ReturnRow[] = (returnsResult.data ?? []).map((r) => ({
        id: r.id,
        return_number: r.return_number,
        return_date: r.return_date,
        type: r.type,
        reference_type: r.reference_type,
        reference_id: r.reference_id,
        contact_name: (r.contacts as { name: string } | null)?.name ?? null,
        status: r.status,
        total_amount: r.total_amount,
        reason: r.reason,
      }));

      return {
        returns,
        contacts: contactsResult.data ?? [],
        products: productsResult.data ?? [],
        sales: salesResult.data ?? [],
        purchaseOrders: purchaseOrdersResult.data ?? [],
      };
    },
    enabled: !!organizationId,
  });

  const data = query.data ?? {
    returns: [],
    contacts: [],
    products: [],
    sales: [],
    purchaseOrders: [],
  };
  const isLoading = query.isLoading || query.isFetching;

  const selectedReturn = selectedReturnId
    ? (data.returns.find((r) => r.id === selectedReturnId) ?? null)
    : null;

  return (
    <PageShell
      title="Буцаалт"
      description="Борлуулалт болон худалдан авалтын буцаалтууд"
      actions={
        <ReturnCreateDrawer
          contacts={data.contacts}
          products={data.products}
          sales={data.sales}
          purchaseOrders={data.purchaseOrders}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <ErpDataTable
            title="Буцаалтын жагсаалт"
            columns={columns}
            data={[]}
            loading={true}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => setSelectedReturnId(row.id)}
            emptyState={{
              title: "Буцаалт байхгүй",
              description: "Шинэ буцаалт үүсгэнэ үү.",
            }}
          />
        </div>
      ) : (
        <>
          <ErpDataTable
            title="Буцаалтын жагсаалт"
            columns={columns}
            data={data.returns}
            loading={false}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => setSelectedReturnId(row.id)}
            emptyState={{
              title: "Буцаалт байхгүй",
              description: "Шинэ буцаалт үүсгэнэ үү.",
            }}
          />
          <ReturnDetailDrawer
            returnData={selectedReturn}
            open={!!selectedReturnId}
            onOpenChange={(open) => {
              if (!open) setSelectedReturnId(null);
            }}
          />
        </>
      )}
    </PageShell>
  );
}
