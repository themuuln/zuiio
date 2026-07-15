import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { getPackageDetail } from "@/lib/catalog";
import { countryFlag, formatData, formatMnt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([
    getTranslations("packages"),
    getTranslations("common"),
  ]);
  const pkg = await getPackageDetail(id);
  if (!pkg) notFound();

  const regionName = locale === "mn" ? pkg.regionNameMn : pkg.regionNameEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 pb-16">
        <div className="py-6">
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/destinations/${pkg.regionSlug}`}
              className="hover:underline"
            >
              ← {regionName}
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {regionName} —{" "}
            {pkg.isUnlimited ? tc("unlimited") : formatData(pkg.dataMb)}
          </h1>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">{t("data")}</span>
              <span className="font-semibold">
                {pkg.isUnlimited ? tc("unlimited") : formatData(pkg.dataMb)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">{t("validity")}</span>
              <span className="font-semibold">
                {tc("days", { count: pkg.validityDays })}
              </span>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                {t("coverage")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pkg.coverageCountries.map((code) => (
                  <Badge key={code} variant="secondary">
                    {countryFlag(code)} {code}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatMnt(pkg.retailMnt)}
              </span>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={`/checkout?package=${pkg.id}`} />}
              >
                {t("buy")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-sm text-muted-foreground">
          💡 {t("compatibility")}
        </p>
      </main>
    </>
  );
}
