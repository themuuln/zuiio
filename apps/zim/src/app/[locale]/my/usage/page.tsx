import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import type { OrderDetail } from "@/lib/db/types";
import { formatData } from "@/lib/format";
import { getProviderByName } from "@/lib/provider";
import type { EsimUsage } from "@/lib/provider/types";
import { verifyOrderAccessToken } from "@/lib/token";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Display types
// ---------------------------------------------------------------------------

interface ESimUsageCard {
  packageName: string;
  usedMb: number;
  totalMb: number | null;
  expiresAt: string | null;
  providerName: string;
  status: string;
  days: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysRemaining(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

function usagePercent(usedMb: number, totalMb: number | null): number {
  if (!totalMb || totalMb === 0) return 0;
  return Math.min(Math.round((usedMb / totalMb) * 100), 100);
}

function statusVariant(
  status: string,
  days: number | null,
): "default" | "secondary" | "destructive" {
  if (status === "expired" || status === "failed" || days === 0)
    return "destructive";
  if (days !== null && days <= 3) return "secondary";
  if (status === "activated" || status === "delivered") return "default";
  return "secondary";
}

function statusLabel(status: string): string {
  switch (status) {
    case "activated":
      return "active";
    case "delivered":
      return "active";
    case "expired":
      return "expired";
    case "failed":
      return "failed";
    default:
      return status;
  }
}

/**
 * Build display cards from order detail + live usage data.
 * Failures per-eSIM are non-fatal: we show what we can.
 */
function buildCards(
  detail: OrderDetail,
  usageMap: Map<string, EsimUsage>,
): ESimUsageCard[] {
  // Index items by id for quick lookup
  const itemsById = new Map(detail.items.map((i) => [i.id, i]));

  return detail.esims
    .filter((esim) => esim.provider_esim_id)
    .map((esim) => {
      const item = itemsById.get(esim.order_item_id);
      const usage = usageMap.get(esim.id);
      const days = usage?.expiresAt ? daysRemaining(usage.expiresAt) : null;

      return {
        packageName: item?.package_name ?? "eSIM",
        usedMb: usage?.usedMb ?? 0,
        totalMb: usage?.totalMb ?? null,
        expiresAt: usage?.expiresAt ?? null,
        providerName: esim.provider,
        status: esim.status,
        days,
      };
    });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function UsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; t?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("usage");

  const { order: orderCode, t: token } = await searchParams;

  // --- No order code provided ---
  if (!orderCode) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 pb-16">
          <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
          <p className="py-8 text-center text-muted-foreground">
            {t("noOrderCode")}
          </p>
        </main>
      </>
    );
  }

  // --- Token verification ---
  if (token && !verifyOrderAccessToken(orderCode, token)) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 pb-16">
          <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
          <p className="py-8 text-center text-muted-foreground">
            {t("unauthorized")}
          </p>
        </main>
      </>
    );
  }

  // --- Load order ---
  const db = getDb();
  const detail: OrderDetail | null = await db.getOrderDetail(orderCode);

  if (!detail) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 pb-16">
          <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
          <p className="py-8 text-center text-muted-foreground">
            {t("notFound")}
          </p>
        </main>
      </>
    );
  }

  // --- Fetch live usage per eSIM ---
  const usageMap = new Map<string, EsimUsage>();
  await Promise.all(
    detail.esims
      .filter(
        (esim): esim is typeof esim & { provider_esim_id: string } =>
          esim.provider_esim_id !== null,
      )
      .map(async (esim) => {
        try {
          const provider = getProviderByName(esim.provider);
          if (!provider?.getUsage) return;
          const usage = await provider.getUsage(esim.provider_esim_id);
          if (usage) usageMap.set(esim.id, usage);
        } catch {
          // Provider call failed — render card without usage data
        }
      }),
  );

  const cards = buildCards(detail, usageMap);

  // --- Render ---
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>

        <p className="mb-4 text-sm text-muted-foreground">
          {t("orderCode")}:{" "}
          <span className="font-mono font-medium text-foreground">
            {orderCode}
          </span>
        </p>

        {cards.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {t("noEsims")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const percent = usagePercent(card.usedMb, card.totalMb);
              const variant = statusVariant(card.status, card.days);

              return (
                <Card key={card.packageName}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {card.packageName}
                      </CardTitle>
                      <Badge variant={variant}>
                        {t(`status.${statusLabel(card.status)}`)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Data usage */}
                    <div>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("dataUsed")}
                        </span>
                        <span className="font-medium">
                          {formatData(card.usedMb) ?? "0 MB"}
                          {" / "}
                          {card.totalMb !== null
                            ? (formatData(card.totalMb) ?? "—")
                            : t("unlimited")}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {card.totalMb !== null ? (
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={t("aria.usageProgress", {
                            percent: String(percent),
                          })}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor:
                                percent >= 90
                                  ? "var(--color-destructive)"
                                  : percent >= 70
                                    ? "var(--color-chart-4, hsl(45, 93%, 47%))"
                                    : "var(--color-primary)",
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {t("unlimitedData")}
                        </p>
                      )}
                    </div>

                    {/* Days remaining */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("daysRemaining")}
                      </span>
                      <span className="font-medium">
                        {card.days !== null
                          ? t("days", { count: String(card.days) })
                          : "—"}
                      </span>
                    </div>

                    {/* Provider */}
                    <p className="text-xs text-muted-foreground/70">
                      {card.providerName}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
