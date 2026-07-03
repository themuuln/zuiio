import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type SaleRow = Database["public"]["Tables"]["sales"]["Row"];
type StockMovementRow = Database["public"]["Tables"]["stock_movements"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export type AppProfile = ProfileRow & {
  organizations?: Pick<
    OrganizationRow,
    "name" | "currency" | "company_type"
  > | null;
};

export type DashboardMetrics = {
  totalSales: number;
  totalPaid: number;
  totalExpenses: number;
  netCash: number;
  saleCount: number;
  expenseCount: number;
  lowStockCount: number;
  pendingSalesCount: number;
};

export type AppContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  profile: AppProfile;
  organizationId: string;
};

export async function requireAppContext(): Promise<AppContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, organization_id, role, organizations(name, currency, company_type)",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }

  return {
    supabase,
    userId: user.id,
    profile: profile as AppProfile,
    organizationId: profile.organization_id,
  };
}

export function parseAmount(value: FormDataEntryValue | null) {
  return Number(value ?? 0);
}

export function isValidPositiveNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export async function getDashboardMetrics(
  organizationId: string,
  today: string,
) {
  const supabase = await createClient();

  const [
    { data: sales },
    { data: expenses },
    { data: lowStock },
    { data: pendingSales },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, paid_amount")
      .eq("organization_id", organizationId)
      .eq("sale_date", today),
    supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("expense_date", today),
    supabase
      .from("products")
      .select("id, current_stock, min_stock")
      .eq("organization_id", organizationId),
    supabase
      .from("sales")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  const totalSales =
    sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) ?? 0;
  const totalPaid =
    sales?.reduce((sum, sale) => sum + Number(sale.paid_amount ?? 0), 0) ?? 0;
  const totalExpenses =
    expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0;

  return {
    totalSales,
    totalPaid,
    totalExpenses,
    netCash: totalPaid - totalExpenses,
    saleCount: sales?.length ?? 0,
    expenseCount: expenses?.length ?? 0,
    lowStockCount:
      lowStock?.filter(
        (product) =>
          Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0),
      ).length ?? 0,
    pendingSalesCount: pendingSales?.length ?? 0,
  } satisfies DashboardMetrics;
}

export type ProductListItem = ProductRow & {
  categories?: Pick<CategoryRow, "name"> | null;
};

export type StockMovementListItem = StockMovementRow & {
  products?: Pick<ProductRow, "name" | "unit" | "sku"> | null;
};

export type SaleListItem = SaleRow & {
  contacts?: Pick<ContactRow, "name"> | null;
};

export type ExpenseListItem = ExpenseRow;

export type ContactListItem = ContactRow;
