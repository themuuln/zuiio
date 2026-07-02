import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const { data: rows, error } = await supabase
    .from("work_orders")
    .select(
      `
      customer_id,
      total,
      completed_at,
      customers!inner (
        id,
        first_name,
        last_name,
        company_name,
        phone
      )
    `,
    )
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .not("customer_id", "is", null)
    .order("total", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "QUERY_FAILED", message: error.message } },
      { status: 500 },
    );
  }

  const revenueMap = new Map<
    string,
    {
      id: string;
      name: string;
      phone: string | null;
      totalRevenue: number;
      visitCount: number;
    }
  >();

  for (const row of rows) {
    const customer = row.customers as unknown as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
      phone: string | null;
    };
    if (!customer?.id) continue;

    const existing = revenueMap.get(customer.id);
    const name =
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.company_name ||
      "Unknown";

    if (existing) {
      existing.totalRevenue += Number(row.total);
      existing.visitCount += 1;
    } else {
      revenueMap.set(customer.id, {
        id: customer.id,
        name,
        phone: customer.phone,
        totalRevenue: Number(row.total),
        visitCount: 1,
      });
    }
  }

  const customers = Array.from(revenueMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return NextResponse.json({ data: { customers } });
});
