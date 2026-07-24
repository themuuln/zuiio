import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { LookupForm } from "./_form";

export default async function LookupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lookup");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="py-6 text-2xl font-bold">{t("title")}</h1>
        <LookupForm />
      </main>
    </>
  );
}
