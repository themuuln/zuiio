import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { orderAccessToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("myOrders");

  const db = getDb();
  let orders: Awaited<ReturnType<typeof db.listOrdersByAuthUser>> = [];
  if (db.backend === "supabase") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) orders = await db.listOrdersByAuthUser(user.id);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.order_code}?t=${orderAccessToken(order.order_code)}`}
              >
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-mono font-medium">
                        {order.order_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.status}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatMnt(order.total_mnt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
