import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { verifyOrderAccessToken } from "@/lib/token";
import { EsimCard } from "./_esim-card";
import { ProvisioningWatcher } from "./_watcher";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderCode: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ locale, orderCode }, { t: token }] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);

  const db = getDb();
  const detail = await db.getOrderDetail(orderCode);
  if (!detail) notFound();
  const { order, items, esims } = detail;

  // Access: HMAC token (guest) or the authed customer who owns it.
  let allowed = verifyOrderAccessToken(orderCode, token);
  if (!allowed) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const own = await db.listOrdersByAuthUser(user.id);
      allowed = own.some((o) => o.id === order.id);
    }
  }
  if (!allowed) notFound();

  const t = await getTranslations("order");

  const statusKey = (
    {
      pending_payment: "statusPending",
      paid: "statusProvisioning",
      provisioning: "statusProvisioning",
      delivered: "statusDelivered",
      partially_failed: "statusFailed",
      failed: "statusFailed",
      expired: "statusExpired",
      cancelled: "statusExpired",
      refunded: "statusRefunded",
    } as const
  )[order.status];

  const inProgress = ["paid", "provisioning"].includes(order.status);
  const deliveredEsims = esims.filter((e) => e.lpa_string);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono font-semibold">{order.order_code}</p>
              <p className="font-bold">{formatMnt(order.total_mnt)}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {items[0]?.package_name}
            </p>
          </CardContent>
        </Card>

        <p
          className={`mb-6 rounded-lg border p-4 text-center font-medium ${
            order.status === "delivered"
              ? "border-green-600/40 bg-green-600/10 text-green-700"
              : ["failed", "partially_failed"].includes(order.status)
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "bg-muted/50"
          }`}
        >
          {order.status === "delivered" ? "✓ " : inProgress ? "⏳ " : ""}
          {t(statusKey)}
        </p>

        {inProgress && <ProvisioningWatcher orderCode={orderCode} />}

        {deliveredEsims.length > 0 && (
          <>
            <h2 className="mb-2 font-semibold">{t("scanTitle")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("scanHint")}
            </p>
            <div className="flex flex-col gap-4">
              {deliveredEsims.map((esim) => (
                <EsimCard key={esim.id} esim={esim} />
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✉️ {t("emailSent", { email: order.email })}
            </p>

            <Accordion className="mt-6">
              <AccordionItem value="ios">
                <AccordionTrigger>📱 {t("installIos")}</AccordionTrigger>
                <AccordionContent>{t("installIosSteps")}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="android">
                <AccordionTrigger>🤖 {t("installAndroid")}</AccordionTrigger>
                <AccordionContent>{t("installAndroidSteps")}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </main>
    </>
  );
}
