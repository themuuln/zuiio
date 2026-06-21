"use client";

import {
  BuildingsIcon,
  CoinsIcon,
  FileTextIcon,
  FolderIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CategoryCreateDrawer } from "@/components/categories/category-create-drawer";
import { CustomerCreateDrawer } from "@/components/customers/customer-create-drawer";
import { ExpensesCreateDrawer } from "@/components/expenses/expenses-create-drawer";
import { InvoiceCreateDrawer } from "@/components/invoices/invoice-create-drawer";
import { ProductCreateDrawer } from "@/components/products/product-create-drawer";
import { SalesCreateDrawer } from "@/components/sales/sales-create-drawer";
import { SupplierCreateDrawer } from "@/components/suppliers/supplier-create-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

type ActiveDrawer =
  | "product"
  | "sale"
  | "invoice"
  | "expense"
  | "customer"
  | "supplier"
  | "category"
  | null;

export function QuickCreateDropdown({
  organizationId,
}: {
  organizationId: string;
}) {
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  const handleClose = () => setActiveDrawer(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="h-8 gap-1">
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Шинэ</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Бүртгэл нэмэх</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setActiveDrawer("product")}>
            <PackageIcon className="size-4" />
            Бүтээгдэхүүн
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveDrawer("sale")}>
            <ReceiptIcon className="size-4" />
            Борлуулалт
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveDrawer("invoice")}>
            <FileTextIcon className="size-4" />
            Нэхэмжлэл
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveDrawer("expense")}>
            <CoinsIcon className="size-4" />
            Зарлага
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setActiveDrawer("customer")}>
            <UsersIcon className="size-4" />
            Харилцагч
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveDrawer("supplier")}>
            <BuildingsIcon className="size-4" />
            Нийлүүлэгч
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveDrawer("category")}>
            <FolderIcon className="size-4" />
            Ангилал
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeDrawer === "product" && (
        <ProductCreateDrawer
          companyType=""
          organizationId={organizationId}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}

      {activeDrawer === "sale" && (
        <SaleDrawerWrapper
          organizationId={organizationId}
          onClose={handleClose}
        />
      )}

      {activeDrawer === "invoice" && (
        <InvoiceDrawerWrapper
          organizationId={organizationId}
          onClose={handleClose}
        />
      )}

      {activeDrawer === "expense" && (
        <ExpensesCreateDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}

      {activeDrawer === "customer" && (
        <CustomerCreateDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}

      {activeDrawer === "supplier" && (
        <SupplierCreateDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}

      {activeDrawer === "category" && (
        <CategoryCreateDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        />
      )}
    </>
  );
}

/* Wrapper that fetches products for SalesCreateDrawer */
function SaleDrawerWrapper({
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
      const { data } = await supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit, barcode, image_url")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name");
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

/* Wrapper that fetches contacts + products for InvoiceCreateDrawer */
function InvoiceDrawerWrapper({
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
      const { data } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("type", "customer")
        .order("name");
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["quick-create", "products", organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name");
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
