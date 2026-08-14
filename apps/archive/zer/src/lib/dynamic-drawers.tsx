"use client";
import dynamic from "next/dynamic";

// Shared loading fallback — renders a skeleton that matches roughly the drawer trigger button size
const DrawerTriggerSkeleton = () => (
  <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
);

// ── Product Drawers ──

export const DynamicProductCreateDrawer = dynamic(
  () =>
    import("@/components/products/product-create-drawer").then(
      (m) => m.ProductCreateDrawer,
    ),
  { ssr: false, loading: DrawerTriggerSkeleton },
);

export const DynamicProductDetailDrawer = dynamic(
  () =>
    import("@/components/products/product-detail-drawer").then(
      (m) => m.ProductDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicProductEditDrawer = dynamic(
  () =>
    import("@/components/products/product-edit-drawer").then(
      (m) => m.ProductEditDrawer,
    ),
  { ssr: false },
);

export const DynamicVariantManagerDrawer = dynamic(
  () =>
    import("@/components/products/variant-manager-drawer").then(
      (m) => m.VariantManagerDrawer,
    ),
  { ssr: false },
);

export const DynamicBundleCreateDrawer = dynamic(
  () =>
    import("@/components/products/bundle-create-drawer").then(
      (m) => m.BundleCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicBundleDetailDrawer = dynamic(
  () =>
    import("@/components/products/bundle-detail-drawer").then(
      (m) => m.BundleDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicBundleEditDrawer = dynamic(
  () =>
    import("@/components/products/bundle-edit-drawer").then(
      (m) => m.BundleEditDrawer,
    ),
  { ssr: false },
);

// ── Customer Drawers ──

export const DynamicCustomerCreateDrawer = dynamic(
  () =>
    import("@/components/customers/customer-create-drawer").then(
      (m) => m.CustomerCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicCustomerDetailDrawer = dynamic(
  () =>
    import("@/components/customers/customer-detail-drawer").then(
      (m) => m.CustomerDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicCustomerEditDrawer = dynamic(
  () =>
    import("@/components/customers/customer-edit-drawer").then(
      (m) => m.CustomerEditDrawer,
    ),
  { ssr: false },
);

// ── Supplier Drawers ──

export const DynamicSupplierCreateDrawer = dynamic(
  () =>
    import("@/components/suppliers/supplier-create-drawer").then(
      (m) => m.SupplierCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicSupplierDetailDrawer = dynamic(
  () =>
    import("@/components/suppliers/supplier-detail-drawer").then(
      (m) => m.SupplierDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicSupplierEditDrawer = dynamic(
  () =>
    import("@/components/suppliers/supplier-edit-drawer").then(
      (m) => m.SupplierEditDrawer,
    ),
  { ssr: false },
);

// ── Category Drawers ──

export const DynamicCategoryCreateDrawer = dynamic(
  () =>
    import("@/components/categories/category-create-drawer").then(
      (m) => m.CategoryCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicCategoryDetailDrawer = dynamic(
  () =>
    import("@/components/categories/category-detail-drawer").then(
      (m) => m.CategoryDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicCategoryEditDrawer = dynamic(
  () =>
    import("@/components/categories/category-edit-drawer").then(
      (m) => m.CategoryEditDrawer,
    ),
  { ssr: false },
);

// ── Sales Drawers ──

export const DynamicSalesCreateDrawer = dynamic(
  () =>
    import("@/components/sales/sales-create-drawer").then(
      (m) => m.SalesCreateDrawer,
    ),
  { ssr: false },
);

export const DynamicSaleDetailDrawer = dynamic(
  () =>
    import("@/components/sales/sale-detail-drawer").then(
      (m) => m.SaleDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicProductBrowserDrawer = dynamic(
  () =>
    import("@/components/sales/product-browser-drawer").then(
      (m) => m.ProductBrowserDrawer,
    ),
  { ssr: false },
);

// ── HR Drawers ──

export const DynamicEmployeeCreateDrawer = dynamic(
  () =>
    import("@/components/hr/employee-create-drawer").then(
      (m) => m.EmployeeCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

// ── Accounting Drawers ──

export const DynamicAccountCreateDrawer = dynamic(
  () =>
    import("@/components/accounting/account-create-drawer").then(
      (m) => m.AccountCreateDrawer,
    ),
  { ssr: false },
);

export const DynamicJournalEntryCreateDrawer = dynamic(
  () =>
    import("@/components/accounting/journal-entry-create-drawer").then(
      (m) => m.JournalEntryCreateDrawer,
    ),
  { ssr: false },
);

export const DynamicJournalEntryDetailDrawer = dynamic(
  () =>
    import("@/components/accounting/journal-entry-detail-drawer").then(
      (m) => m.JournalEntryDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicJournalEntryEditDrawer = dynamic(
  () =>
    import("@/components/accounting/journal-entry-edit-drawer").then(
      (m) => m.JournalEntryEditDrawer,
    ),
  { ssr: false },
);

// ── Expense Drawers ──

export const DynamicExpenseCreateDrawer = dynamic(
  () =>
    import("@/components/expenses/expense-create-drawer").then(
      (m) => m.ExpenseCreateDrawer,
    ),
  { ssr: false },
);

export const DynamicExpenseDetailDrawer = dynamic(
  () =>
    import("@/components/expenses/expense-detail-drawer").then(
      (m) => m.ExpenseDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicExpenseEditDrawer = dynamic(
  () =>
    import("@/components/expenses/expense-edit-drawer").then(
      (m) => m.ExpenseEditDrawer,
    ),
  { ssr: false },
);

// ── Inventory Drawers ──

export const DynamicWarehouseDetailDrawer = dynamic(
  () =>
    import("@/components/inventory/warehouse-detail-drawer").then(
      (m) => m.WarehouseDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicWarehouseEditDrawer = dynamic(
  () =>
    import("@/components/inventory/warehouse-edit-drawer").then(
      (m) => m.WarehouseEditDrawer,
    ),
  { ssr: false },
);

export const DynamicMovementDetailDrawer = dynamic(
  () =>
    import("@/components/inventory/movement-detail-drawer").then(
      (m) => m.MovementDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicRestockDrawer = dynamic(
  () =>
    import("@/components/inventory/restock-drawer").then(
      (m) => m.RestockDrawer,
    ),
  { ssr: false },
);

// ── Discount Drawers ──

export const DynamicDiscountCreateDrawer = dynamic(
  () =>
    import("@/components/discounts/discount-create-drawer").then(
      (m) => m.DiscountCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicDiscountDetailDrawer = dynamic(
  () =>
    import("@/components/discounts/discount-detail-drawer").then(
      (m) => m.DiscountDetailDrawer,
    ),
  { ssr: false },
);

export const DynamicDiscountEditDrawer = dynamic(
  () =>
    import("@/components/discounts/discount-edit-drawer").then(
      (m) => m.DiscountEditDrawer,
    ),
  { ssr: false },
);

// ── Invoice Drawers ──

export const DynamicInvoiceCreateDrawer = dynamic(
  () =>
    import("@/components/invoices/invoice-create-drawer").then(
      (m) => m.InvoiceCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicInvoiceDetailDrawer = dynamic(
  () =>
    import("@/components/invoices/invoice-detail-drawer").then(
      (m) => m.InvoiceDetailDrawer,
    ),
  { ssr: false },
);

// ── Purchase Drawers ──

export const DynamicPurchaseCreateDrawer = dynamic(
  () =>
    import("@/components/purchases/purchase-create-drawer").then(
      (m) => m.PurchaseCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicPurchaseDetailDrawer = dynamic(
  () =>
    import("@/components/purchases/purchase-detail-drawer").then(
      (m) => m.PurchaseDetailDrawer,
    ),
  { ssr: false },
);

// ── Quotation Drawers ──

export const DynamicQuotationCreateDrawer = dynamic(
  () =>
    import("@/components/quotations/quotation-create-drawer").then(
      (m) => m.QuotationCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicQuotationDetailDrawer = dynamic(
  () =>
    import("@/components/quotations/quotation-detail-drawer").then(
      (m) => m.QuotationDetailDrawer,
    ),
  { ssr: false },
);

// ── Return Drawers ──

export const DynamicReturnCreateDrawer = dynamic(
  () =>
    import("@/components/returns/return-create-drawer").then(
      (m) => m.ReturnCreateDrawer,
    ),
  { loading: DrawerTriggerSkeleton },
);

export const DynamicReturnDetailDrawer = dynamic(
  () =>
    import("@/components/returns/return-detail-drawer").then(
      (m) => m.ReturnDetailDrawer,
    ),
  { ssr: false },
);

// ── Shop Drawers ──

export const DynamicCheckoutDrawer = dynamic(
  () =>
    import("@/components/shop/checkout-drawer").then((m) => m.CheckoutDrawer),
  { ssr: false },
);

export const DynamicReceiptDrawer = dynamic(
  () => import("@/components/shop/receipt-drawer").then((m) => m.ReceiptDrawer),
  { ssr: false },
);

// ── ERP Quick-Create Wrappers ──

export const DynamicSaleDrawer = dynamic(
  () =>
    import("@/components/erp/quick-create-sale-wrapper").then(
      (m) => m.QuickCreateSaleWrapper,
    ),
  { ssr: false },
);

export const DynamicInvoiceDrawer = dynamic(
  () =>
    import("@/components/erp/quick-create-invoice-wrapper").then(
      (m) => m.QuickCreateInvoiceWrapper,
    ),
  { ssr: false },
);
