import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/marketing/Hero";
import { ProductJsonLd } from "@/components/marketing/ProductJsonLd";
import { Link } from "@/lib/i18n/navigation";

const features = [
  { key: "1" },
  { key: "2" },
  { key: "3" },
  { key: "4" },
  { key: "5" },
  { key: "6" },
];

const featIcons = [
  // 5 Ways to Sign In - key icon
  <svg
    key="signin"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>,
  // One Account, All Products - layers icon
  <svg
    key="sso"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>,
  // Team Management - users icon
  <svg
    key="team"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  // MFA - shield icon
  <svg
    key="mfa"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  // Passkey - fingerprint icon
  <svg
    key="passkey"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
  </svg>,
  // Audit Trail - list icon
  <svg
    key="audit"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>,
];

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ZuiioIDPage" });
  return {
    title: `${t("title")} — Identity Platform`,
    description: t("subtitle"),
  };
}

export default async function ZuiioIdProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ZuiioIDPage");

  return (
    <>
      <ProductJsonLd
        name="Zuiio ID"
        description={t("jsonld-description")}
        url={"/products/zuiio-id"}
        category={t("jsonld-category")}
      />
      <Hero
        title={t("title")}
        subtitle={t("subtitle")}
        cta={{ label: t("cta"), href: "/pricing" }}
        secondaryCta={{ label: t("learn-more"), href: "#features" }}
      />
      <section id="features" className="reveal mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("features-title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("features-subtitle")}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
          <div className="bento-cell col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center p-8">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--brand-violet-glow)",
                color: "var(--color-primary)",
              }}
            >
              {featIcons[0]}
            </div>
            <h3 className="text-xl font-semibold md:text-2xl">
              {t("feature-1-title")}
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              {t("feature-1-desc")}
            </p>
          </div>
          {features.slice(1).map((f, i) => (
            <div
              key={f.key}
              className="bento-cell flex flex-col justify-center p-6"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    i % 2 === 0
                      ? "var(--brand-teal-glow)"
                      : "var(--brand-violet-glow)",
                  color:
                    i % 2 === 0 ? "var(--brand-teal)" : "var(--color-primary)",
                }}
              >
                {featIcons[i + 1]}
              </div>
              <h3 className="text-base font-semibold">
                {t(`feature-${f.key}-title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`feature-${f.key}-desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-24 text-center">
        <div className="rounded-2xl border border-border bg-card px-6 py-16 relative isolate overflow-hidden">
          <div
            className="pointer-events-none absolute -inset-32 -z-10 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
            }}
            aria-hidden="true"
          />
          <h2
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("cta-title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            {t("cta-subtitle")}
          </p>
          <Link href="/pricing" className="btn-primary mt-8">
            {t("cta-button")}
          </Link>
        </div>
      </section>
    </>
  );
}
