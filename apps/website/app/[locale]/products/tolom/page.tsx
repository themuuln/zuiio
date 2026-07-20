import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/marketing/Hero";
import { Link } from "@/lib/i18n/navigation";

const features = [
  { key: "1" },
  { key: "2" },
  { key: "3" },
  { key: "4" },
  { key: "5" },
  { key: "6" },
  { key: "7" },
];

const featIcons = [
  <svg
    key="j"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>,
  <svg
    key="r"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>,
  <svg
    key="i"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>,
  <svg
    key="v"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg
    key="c"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>,
  <svg
    key="f"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>,
  <svg
    key="ai"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h.01" />
    <path d="M12 10h.01" />
    <path d="M16 10h.01" />
  </svg>,
];

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TolomPage" });
  return { title: `${t("title")} — Auto Repair`, description: t("subtitle") };
}

export default async function TolomProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("TolomPage");

  return (
    <>
      <Hero
        title={t("title")}
        subtitle={t("subtitle")}
        cta={{ label: t("cta"), href: "/pricing" }}
        secondaryCta={{ label: t("learn-more"), href: "#features" }}
      />
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
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
        <div className="grid gap-5 md:grid-cols-3">
          <div className="bento-cell col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center p-8">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--brand-teal-glow)",
                color: "var(--brand-teal)",
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
                      ? "var(--brand-violet-glow)"
                      : "var(--brand-teal-glow)",
                  color:
                    i % 2 === 0 ? "var(--color-primary)" : "var(--brand-teal)",
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
                "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-teal-glow), transparent)",
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
