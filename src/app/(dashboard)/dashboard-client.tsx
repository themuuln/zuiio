export interface DashboardData {
  todaySalesTotal: number;
  todayExpensesTotal: number;
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  lowStockCount: number;
  pendingSalesCount: number;
  inventoryValue: number;
  recentSales: Array<{
    id: string;
    sale_date: string;
    contact_name: string | null;
    total_amount: number;
    status: string | null;
  }>;
  monthlyTrend: Array<{
    date: string;
    total: number;
  }>;
}
