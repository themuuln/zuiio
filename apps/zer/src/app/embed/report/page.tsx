import {
  ChartLineUp,
  Package,
  Receipt,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { addDays, startOfDay, subDays } from "date-fns";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { hashToken, isTokenUsable } from "@/lib/embed";
import { formatCurrency, formatDate } from "@/lib/format";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n/messages";
import { createServiceClient } from "@/lib/supabase/server-service";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface EmbedTokenRow {
  id: string;
  organization_id: string;
  token_hash: string;
  label: string;
  scopes: string[];
  expires_at: string;
  created_by: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

interface SaleRow {
  id: string;
  total_amount: number | null;
  sale_date: string;
  status: string | null;
  contacts: { name: string } | null;
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцалсан";
    default:
      return status ?? "—";
  }
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-600";
    case "pending":
      return "bg-amber-500/10 text-amber-600";
    case "cancelled":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

async function loadReport(orgId: string) {
  const supabase = createServiceClient();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekAgo = subDays(today, 6);

  const [
    orgResult,
    orgProfileResult,
    todaySales,
    trendSales,
    lowStock,
    recent,
  ] = await Promise.all([
    withDbCapture(
      "embed: org name",
      supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle(),
    ),
    withDbCapture(
      "embed: org display name",
      supabase
        .from("organization_public_profiles")
        .select("display_name")
        .eq("organization_id", orgId)
        .maybeSingle(),
    ),
    withDbCapture(
      "embed: today sales",
      supabase
        .from("sales")
        .select("total_amount")
        .eq("organization_id", orgId)
        .gte("sale_date", today.toISOString())
        .lt("sale_date", tomorrow.toISOString()),
    ),
    withDbCapture(
      "embed: 7 day trend",
      supabase
        .from("sales")
        .select("total_amount, sale_date")
        .eq("organization_id", orgId)
        .gte("sale_date", weekAgo.toISOString())
        .lt("sale_date", tomorrow.toISOString()),
    ),
    withDbCapture(
      "embed: low stock count",
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .lt("current_stock", 1),
    ),
    withDbCapture(
      "embed: recent sales",
      supabase
        .from("sales")
        .select("id, total_amount, sale_date, status, contacts(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
    ),
  ]);

  const todaySalesTotal = (todaySales.data ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0,
  );

  const trendMap = new Map<string, number>();
  for (const sale of trendSales.data ?? []) {
    const day = sale.sale_date.slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + (sale.total_amount ?? 0));
  }
  const trend: Array<{ date: string; total: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    trend.push({
      date: date.toISOString(),
      total: trendMap.get(date.toISOString().slice(0, 10)) ?? 0,
    });
  }

  return {
    orgName:
      (orgProfileResult.data as { display_name: string | null } | null)
        ?.display_name ??
      orgResult.data?.name ??
      "—",
    todaySalesTotal,
    trend,
    lowStockCount: (lowStock as unknown as { count: number | null }).count ?? 0,
    recentSales: (recent.data as SaleRow[] | null) ?? [],
  };
}

function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WarningCircle className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}

export default async function EmbedReportPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const cookieStore = await cookies();
  const localeValue = cookieStore.get("zer_locale")?.value;
  const locale = isLocale(localeValue) ? localeValue : DEFAULT_LOCALE;
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  if (!token) {
    return (
      <ErrorState
        title={t("embed.report.missingToken")}
        description={t("embed.report.missingTokenDescription")}
      />
    );
  }

  const supabase = createServiceClient();
  const { data: tokenRow, error } = await withDbCapture(
    "embed: token lookup",
    supabase
      .from("embed_tokens" as never)
      .select("*")
      .eq("token_hash" as never, hashToken(token))
      .maybeSingle(),
  );

  if (error) {
    return (
      <ErrorState
        title={t("embed.report.invalidToken")}
        description={t("embed.report.invalidTokenDescription")}
      />
    );
  }

  const row = tokenRow as unknown as EmbedTokenRow | null;
  if (!row || !isTokenUsable(row)) {
    return (
      <ErrorState
        title={t("embed.report.invalidToken")}
        description={t("embed.report.invalidTokenDescription")}
      />
    );
  }

  const report = await loadReport(row.organization_id);
  const today = new Date();

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-background p-4 text-foreground md:p-8">
      {/* ── Header: org name + date, no navigation ── */}
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {report.orgName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("embed.report.title")} · {formatDate(today.toISOString())}
        </p>
      </header>

      {/* ── Stat cards ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ChartLineUp className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {t("embed.report.todaySales")}
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(report.todaySalesTotal)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {t("embed.report.lowStock")}
            </span>
            <span className="text-lg font-semibold">
              {report.lowStockCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {t("embed.report.recentSales")}
            </span>
            <span className="text-lg font-semibold">
              {report.recentSales.length}
            </span>
          </div>
        </div>
      </section>

      {/* ── 7-day trend list ── */}
      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("embed.report.sevenDay")}
          </h2>
          <span className="text-sm font-semibold">
            {formatCurrency(
              report.trend.reduce((sum, day) => sum + day.total, 0),
            )}
          </span>
        </div>
        <div className="p-4 pt-2">
          <div className="flex flex-col gap-1.5">
            {report.trend.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50"
              >
                <span className="text-sm text-muted-foreground">
                  {formatDate(day.date)}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(day.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent sales ── */}
      <section className="rounded-xl border bg-card">
        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("embed.report.recentSales")}
          </h2>
        </div>
        <div className="p-4 pt-2">
          {report.recentSales.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("embed.report.noSales")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {report.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {sale.contacts?.name ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sale.sale_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(sale.status)}`}
                    >
                      {statusLabel(sale.status)}
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(sale.total_amount ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
