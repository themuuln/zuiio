import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { getRegionPackages } from "@/lib/catalog";
import { countryFlag } from "@/lib/format";
import { PackageList } from "./_package-list";

export const dynamic = "force-dynamic";

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("packages");
  const result = await getRegionPackages(slug);
  if (!result) notFound();

  const regionName =
    locale === "mn" ? result.region.nameMn : result.region.nameEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="flex items-center gap-3 py-6 text-2xl font-bold">
          <span className="text-3xl">
            {countryFlag(result.region.countryCode)}
          </span>
          {t("title", { region: regionName })}
        </h1>
        {result.packages.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <PackageList packages={result.packages} />
        )}
      </main>
    </>
  );
}
