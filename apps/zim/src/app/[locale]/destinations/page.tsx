import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { getDestinations } from "@/lib/catalog";
import { DestinationsBrowser } from "./_browser";

export const dynamic = "force-dynamic";

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("destinations");
  const destinations = (await getDestinations()).filter(
    (d) => d.packageCount > 0,
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
        <DestinationsBrowser destinations={destinations} />
      </main>
    </>
  );
}
