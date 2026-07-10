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
import dynamic from "next/dynamic";
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

const ProductCreateDrawer = dynamic(
  () =>
    import("@/components/products/product-create-drawer").then(
      (m) => m.ProductCreateDrawer,
    ),
  { ssr: false },
);

const SaleDrawer = dynamic(
  () =>
    import("@/components/erp/quick-create-sale-wrapper").then(
      (m) => m.QuickCreateSaleWrapper,
    ),
  { ssr: false },
);

const InvoiceDrawer = dynamic(
  () =>
    import("@/components/erp/quick-create-invoice-wrapper").then(
      (m) => m.QuickCreateInvoiceWrapper,
    ),
  { ssr: false },
);

const ExpensesCreateDrawer = dynamic(
  () =>
    import("@/components/expenses/expense-create-drawer").then(
      (m) => m.ExpenseCreateDrawer,
    ),
  { ssr: false },
);

const CustomerCreateDrawer = dynamic(
  () =>
    import("@/components/customers/customer-create-drawer").then(
      (m) => m.CustomerCreateDrawer,
    ),
  { ssr: false },
);

const SupplierCreateDrawer = dynamic(
  () =>
    import("@/components/suppliers/supplier-create-drawer").then(
      (m) => m.SupplierCreateDrawer,
    ),
  { ssr: false },
);

const CategoryCreateDrawer = dynamic(
  () =>
    import("@/components/categories/category-create-drawer").then(
      (m) => m.CategoryCreateDrawer,
    ),
  { ssr: false },
);

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
