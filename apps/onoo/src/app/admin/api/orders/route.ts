import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";
import { createClient } from "@/lib/supabase/server";

const ordersRoute = createRouteHandlers("orders", {
  select: "*",
});

export const GET = ordersRoute.list((query) =>
  query.order("created_at", { ascending: false }),
);

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { action, orderId } = body;

    if (!action || !orderId) {
      return NextResponse.json(
        { error: "action and orderId required" },
        { status: 400 },
      );
    }

    if (action === "ship") {
      const { error } = await supabase.rpc("cmd_mark_shop_order_shipped", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return NextResponse.json({ status: "shipped" });
    }

    if (action === "cancel") {
      const { error } = await supabase.rpc("cmd_cancel_shop_order", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return NextResponse.json({ status: "cancelled" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'ship' or 'cancel'." },
      { status: 400 },
    );
  });
}
