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
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DynamicCategoryCreateDrawer as CategoryCreateDrawer,
  DynamicCustomerCreateDrawer as CustomerCreateDrawer,
  DynamicExpenseCreateDrawer as ExpensesCreateDrawer,
  DynamicInvoiceDrawer as InvoiceDrawer,
  DynamicProductCreateDrawer as ProductCreateDrawer,
  DynamicSaleDrawer as SaleDrawer,
  DynamicSupplierCreateDrawer as SupplierCreateDrawer,
} from "@/lib/dynamic-drawers";

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
        <DropdownMenuTrigger
          render={
            <Button variant="default" size="sm" className="h-8 gap-1">
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Шинэ</span>
            </Button>
          }
        />
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
        <SaleDrawer organizationId={organizationId} onClose={handleClose} />
      )}

      {activeDrawer === "invoice" && (
        <InvoiceDrawer organizationId={organizationId} onClose={handleClose} />
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
