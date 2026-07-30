import { Truck } from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { addDays, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";

export async function DeliveryStats({ orgId }: { orgId: string }) {
  const supabase = await createClient();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [totalResult, pendingResult, inTransitResult, deliveredResult] =
    await Promise.all([
      withDbCapture(
        "dashboard:delivery_total",
        supabase
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),
      ),
      withDbCapture(
        "dashboard:delivery_pending",
        supabase
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "pending"),
      ),
      withDbCapture(
        "dashboard:delivery_in_transit",
        supabase
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "in_transit"),
      ),
      withDbCapture(
        "dashboard:delivery_delivered",
        supabase
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "delivered")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),
      ),
    ]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Truck className="size-5 text-muted-foreground" />
        <h2 className="text-sm font-medium">Хүргэлт</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-bold">{totalResult.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Өнөөдөр</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
          <p className="text-2xl font-bold text-amber-600">
            {pendingResult.count ?? 0}
          </p>
          <p className="text-xs text-amber-600/70">Хүлээгдэж буй</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-2xl font-bold text-blue-600">
            {inTransitResult.count ?? 0}
          </p>
          <p className="text-xs text-blue-600/70">Замдаа</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
          <p className="text-2xl font-bold text-green-600">
            {deliveredResult.count ?? 0}
          </p>
          <p className="text-xs text-green-600/70">Хүргэгдсэн</p>
        </div>
      </div>
    </div>
  );
}
