import { getTranslations, setRequestLocale } from "next-intl/server";
import { DestinationCard } from "@/components/destination-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getDestinations } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const destinations = (await getDestinations()).filter(
    (d) => d.packageCount > 0,
  );
  const popular = destinations.slice(0, 6);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="flex flex-col items-center gap-5 py-14 text-center">
          <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/destinations" />}
            >
              {t("cta")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/lookup" />}
            >
              {t("lookupOrder")}
            </Button>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1 pt-2 text-sm text-muted-foreground">
            <li>✓ {t("trust1")}</li>
            <li>✓ {t("trust2")}</li>
            <li>✓ {t("trust3")}</li>
          </ul>
        </section>

        <section className="py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("popularDestinations")}
            </h2>
            <Button
              variant="link"
              nativeButton={false}
              render={<Link href="/destinations" />}
            >
              {t("allDestinations")} →
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((dest) => (
              <DestinationCard key={dest.slug} dest={dest} />
            ))}
          </div>
        </section>

        <section className="py-8">
          <h2 className="mb-6 text-xl font-semibold">{t("howItWorks")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {([1, 2, 3] as const).map((step) => (
              <div key={step} className="flex flex-col gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {step}
                </span>
                <h3 className="font-medium">{t(`step${step}Title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`step${step}Body`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
