import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import { PayPanel } from "./_pay-panel";

export const dynamic = "force-dynamic";

interface InvoiceRaw {
  qrImage: string | null;
  qrText: string;
  shortUrl: string | null;
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ locale: string; orderCode: string }>;
}) {
  const { locale, orderCode } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pay");

  const detail = await getDb().getOrderDetail(orderCode);
  if (!detail) notFound();
  const { order, payment } = detail;
  const raw = (payment?.raw ?? {}) as Partial<InvoiceRaw>;
  const isMockInvoice =
    process.env.NODE_ENV !== "production" &&
    Boolean(payment?.invoice_id?.startsWith("mock-inv-"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
        <div className="mb-4 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("orderCode")}</p>
            <p className="font-mono font-semibold">{order.order_code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("total")}</p>
            <p className="text-lg font-bold">{formatMnt(order.total_mnt)}</p>
          </div>
        </div>

        <PayPanel
          orderCode={order.order_code}
          initialStatus={order.status}
          expiresAt={order.expires_at}
          qrImage={raw.qrImage ?? null}
          qrText={raw.qrText ?? null}
          shortUrl={raw.shortUrl ?? null}
          isMockInvoice={isMockInvoice}
        />
      </main>
    </>
  );
}
