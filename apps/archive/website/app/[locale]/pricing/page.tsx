import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingCard } from "@/components/marketing/PricingCard";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const products = [
  { key: "zer", href: "/products/zer" },
  { key: "tolom", href: "/products/tolom" },
  { key: "tumurch", href: "/products/tumurch" },
  { key: "tamga", href: "/products/tamga" },
  { key: "id", href: "/products/zuiio-id" },
];

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PricingPage" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PricingPage");

  return (
    <>
      {/* Hero */}
      <section className="border-b px-6 pt-24 pb-12 text-center">
        <h1
          className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {/* Product Tiles */}
      <section className="border-y border-border bg-muted/30 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <PricingCard
                key={product.key}
                name={t(`${product.key}-title`)}
                price={t(`${product.key}-price`)}
                description={t(`${product.key}-desc`)}
                features={[]}
                ctaLabel={t(`${product.key}-cta`)}
                className="hover:border-primary/50 transition-colors"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bundle Card */}
      <section className="border-b px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="relative isolate overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[3%] to-background p-8 text-center md:p-12">
            <div
              className="pointer-events-none absolute -inset-32 -z-10 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
              }}
              aria-hidden="true"
            />
            <div className="mb-2">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Bundle
              </span>
            </div>
            <h2
              className="text-2xl font-semibold md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("bundle-title")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              {t("bundle-desc")}
            </p>
            <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left text-sm">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{t(`bundle-feature-${i}`)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="mailto:info@zuiiotech.com"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                {t("bundle-cta")}
                <ArrowRightIcon className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="px-6 py-12 text-center md:py-16">
        <div className="mx-auto max-w-md">
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("enterprise-title")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("enterprise-desc")}
          </p>
          <a
            href="mailto:info@zuiiotech.com"
            className="btn-primary mt-6 inline-flex"
          >
            {t("enterprise-cta")}
            <ArrowRightIcon className="ml-1 size-4" />
          </a>
        </div>
      </section>
    </>
  );
}
