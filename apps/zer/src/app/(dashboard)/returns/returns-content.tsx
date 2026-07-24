"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { withDbCapture } from "@zuiio/capture";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { ReturnCreateDrawer } from "@/components/returns/return-create-drawer";
import { ReturnDetailDrawer } from "@/components/returns/return-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useBranchContext } from "@/lib/branch-context";
import { withBranchFilter } from "@/lib/branches";
import { useOrgSettings } from "@/lib/org-settings-context";
import { returnKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { currencyColumn, dateColumn, textColumn } from "@/lib/table-columns";
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

const columns: ColumnDef<ReturnRow>[] = [
  textColumn("return_number", "Дугаар"),
  dateColumn("return_date", "Огноо"),
  {
    accessorKey: "type",
    header: "Төрөл",
    cell: ({ row }) => {
      const val = row.getValue("type") as string;
      return typeLabels[val] ?? val;
    },
  },
  textColumn("contact_name", "Харилцагч", "-"),
  currencyColumn("total_amount", "Нийт дүн"),
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={statusBadgeVariant(status)}>
          {statusLabels[status] ?? status}
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
  const selectedReturn = selectedReturnId
    ? (data.returns.find((r) => r.id === selectedReturnId) ?? null)
    : null;

  if (!query.isPending && data.returns.length === 0) {
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
        <ErpEmptyState
          title="Буцаалт байхгүй"
          description="Шинэ буцаалт үүсгэнэ үү."
        />
      </PageShell>
    );
  }

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
      <DataTable
        columns={columns}
        data={data.returns}
        loading={query.isPending}
        searchColumn="return_number"
        searchPlaceholder="Хайх..."
        pageSize={10}
        totalLabel="буцаалт"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedReturnId(row.id)}
      />
      <ReturnDetailDrawer
        returnData={selectedReturn}
        open={!!selectedReturnId}
        onOpenChange={(open) => {
          if (!open) setSelectedReturnId(null);
        }}
      />
    </PageShell>
  );
}
