import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProductsPage" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProductsPage");

  return (
    <>
      <Hero title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <ProductCard
            name="Zer"
            tagline={t("zer-tagline")}
            description={t("zer-description")}
            href="/products/zer"
            variant="zer"
          />
          <ProductCard
            name="Tolom"
            tagline={t("tolom-tagline")}
            description={t("tolom-description")}
            href="/products/tolom"
            variant="tolom"
          />
          <ProductCard
            name="Tumurch"
            tagline={t("tumurch-tagline")}
            description={t("tumurch-description")}
            href="/products/tumurch"
            variant="tumurch"
          />
          <ProductCard
            name="Tamga"
            tagline={t("tamga-tagline")}
            description={t("tamga-description")}
            href="/products/tamga"
            variant="tamga"
          />
          <ProductCard
            name="Zuiio ID"
            tagline={t("zuiio-id-tagline")}
            description={t("zuiio-id-description")}
            href="/products/zuiio-id"
            variant="zuiio-id"
          />
        </div>
      </section>
    </>
  );
}
