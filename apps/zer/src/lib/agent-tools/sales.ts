import "server-only";
import { capture } from "@zuiio/capture";

import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay, subDays } from "date-fns";
import type { Tool } from "@zuiio/ai-agent";
import type { Database } from "@/lib/supabase/types";

/**
 * Creates Zer-specific agent tools for sales queries.
 * All queries are scoped to the given organization via service_role client.
 */
export function createSalesTools(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool[] {
  return [getSalesSummary(supabase, orgId), getPendingSales(supabase, orgId), getTodaySales(supabase, orgId)];
}

// ─── Helpers ────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  return subDays(new Date(), days).toISOString();
}

function todayStart(): string {
  return startOfDay(new Date()).toISOString();
}

// ─── getSalesSummary ────────────────────────────────────────────────────

function getSalesSummary(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getSalesSummary",
    description:
      "Сүүлийн N өдрийн борлуулалтын хураангуй (нийт дүн, тоо, төлөгдсөн дүн).",
    parameters: [
      {
        name: "days",
        type: "number",
        description: "Хэдэн өдрийн (default 7)",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const days = typeof args.days === "number" && args.days > 0 ? args.days : 7;
      const dateStart = daysAgo(days);

      // Aggregate sales totals
      const { data: salesAgg, error: salesAggError } = await supabase
        .from("sales")
        .select("total_amount, paid_amount")
        .eq("organization_id", orgId)
        .gte("sale_date", dateStart);
      if (salesAggError) { capture(salesAggError, { context: '[agent] getSalesSummary' }); return { error: 'Query failed' }; }

      const rows = salesAgg ?? [];
      const saleCount = rows.length;
      const totalAmount = rows.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const totalPaid = rows.reduce(
        (sum, r) => sum + (r.paid_amount != null ? Number(r.paid_amount) : 0),
        0,
      );

      // Top 5 products by revenue via sale_items
      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select(
          "quantity, total_price, products!inner(name), sales!inner(organization_id, sale_date)",
        )
        .eq("sales.organization_id", orgId)
        .gte("sales.sale_date", dateStart);
      if (itemsError) { capture(itemsError, { context: '[agent] getSalesSummary' }); return { error: 'Query failed' }; }

      const raw = (items ?? []) as unknown as Array<{
        quantity: number;
        total_price: number;
        products: { name: string };
        sales: unknown;
      }>;

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      for (const item of raw) {
        const name = item.products?.name ?? "Тодорхойгүй";
        const qty = Number(item.quantity);
        const rev = Number(item.total_price);
        const existing = productMap.get(name);
        if (existing) {
          existing.quantity += qty;
          existing.revenue += rev;
        } else {
          productMap.set(name, { quantity: qty, revenue: rev });
        }
      }

      const topProducts = [...productMap.entries()]
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        period: `Сүүлийн ${days} өдөр`,
        totalAmount,
        totalPaid,
        saleCount,
        pendingAmount: totalAmount - totalPaid,
        topProducts,
      };
    },
  };
}

// ─── getPendingSales ────────────────────────────────────────────────────

function getPendingSales(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getPendingSales",
    description:
      "Дутуу төлөлттэй борлуулалтууд (paid_amount < total_amount).",
    parameters: [],
    execute: async () => {
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, sale_date, total_amount, paid_amount, status")
        .eq("organization_id", orgId)
        .or("paid_amount.is.null,paid_amount.lt.total_amount")
        .order("sale_date", { ascending: false })
        .limit(10);
      if (salesError) { capture(salesError, { context: '[agent] getPendingSales' }); return { error: 'Query failed' }; }

      const rows = sales ?? [];

      const items = rows.map((s) => ({
        id: s.id,
        saleDate: s.sale_date,
        totalAmount: Number(s.total_amount),
        paidAmount: s.paid_amount != null ? Number(s.paid_amount) : 0,
        remainingAmount:
          Number(s.total_amount) -
          (s.paid_amount != null ? Number(s.paid_amount) : 0),
        status: s.status,
      }));

      const totalPendingAmount = items.reduce(
        (sum, item) => sum + item.remainingAmount,
        0,
      );

      return {
        items,
        totalPendingAmount,
        count: items.length,
      };
    },
  };
}

// ─── getTodaySales ──────────────────────────────────────────────────────

function getTodaySales(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getTodaySales",
    description: "Өнөөдрийн борлуулалтын хураангуй.",
    parameters: [],
    execute: async () => {
      const dayStart = todayStart();

      // Aggregate today's sales totals
      const { data: salesAgg, error: salesAggError } = await supabase
        .from("sales")
        .select("total_amount, paid_amount")
        .eq("organization_id", orgId)
        .gte("sale_date", dayStart);
      if (salesAggError) { capture(salesAggError, { context: '[agent] getTodaySales' }); return { error: 'Query failed' }; }

      const rows = salesAgg ?? [];
      const saleCount = rows.length;
      const totalAmount = rows.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const totalPaid = rows.reduce(
        (sum, r) => sum + (r.paid_amount != null ? Number(r.paid_amount) : 0),
        0,
      );

      // Top products for today
      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select(
          "quantity, total_price, products!inner(name), sales!inner(organization_id, sale_date)",
        )
        .eq("sales.organization_id", orgId)
        .gte("sales.sale_date", dayStart);
      if (itemsError) { capture(itemsError, { context: '[agent] getTodaySales' }); return { error: 'Query failed' }; }

      const raw = (items ?? []) as unknown as Array<{
        quantity: number;
        total_price: number;
        products: { name: string };
        sales: unknown;
      }>;

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      for (const item of raw) {
        const name = item.products?.name ?? "Тодорхойгүй";
        const qty = Number(item.quantity);
        const rev = Number(item.total_price);
        const existing = productMap.get(name);
        if (existing) {
          existing.quantity += qty;
          existing.revenue += rev;
        } else {
          productMap.set(name, { quantity: qty, revenue: rev });
        }
      }

      const topProducts = [...productMap.entries()]
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        date: dayStart,
        totalAmount,
        totalPaid,
        pendingAmount: totalAmount - totalPaid,
        saleCount,
        topProducts,
      };
    },
  };
}
