import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { getPackageDetail } from "@/lib/catalog";
import { formatData, formatMnt } from "@/lib/format";
import { CheckoutForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const [{ locale }, { package: packageId }] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);
  if (!packageId) notFound();

  const [t, tc, pkg] = await Promise.all([
    getTranslations("checkout"),
    getTranslations("common"),
    getPackageDetail(packageId),
  ]);
  if (!pkg) notFound();

  const regionName = locale === "mn" ? pkg.regionNameMn : pkg.regionNameEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>

        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("package")}</p>
              <p className="font-medium">
                {regionName} —{" "}
                {pkg.isUnlimited ? tc("unlimited") : formatData(pkg.dataMb)} ·{" "}
                {tc("days", { count: pkg.validityDays })}
              </p>
            </div>
            <p className="text-lg font-bold">{formatMnt(pkg.retailMnt)}</p>
          </CardContent>
        </Card>

        <CheckoutForm packageId={pkg.id} locale={locale} />
      </main>
    </>
  );
}
