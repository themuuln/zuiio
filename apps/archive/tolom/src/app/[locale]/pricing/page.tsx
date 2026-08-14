import {
  ArrowRight,
  Check,
  HelpCircle,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingNav } from "@/components/landing-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { LandingFooter } from "../_landing-footer";
import { PricingCards } from "./_pricing-cards";

type FeatureStatus = boolean | "addon";

interface PlanFeature {
  key: string;
  included: FeatureStatus;
}

interface PlanData {
  key: string;
  monthlyPrice: string;
  annualPrice: string;
  annualPerMonth: string | null;
  features: PlanFeature[];
  ctaVariant: "default" | "outline";
  popular: boolean;
}

const PLAN_DATA: PlanData[] = [
  {
    key: "core",
    monthlyPrice: "₮199,000",
    annualPrice: "₮1,990,000",
    annualPerMonth: "₮166,000",
    features: [
      { key: "feature1Branch3Users", included: true },
      { key: "featureTabletWorkflow", included: true },
      { key: "featureCustomerVehicleCrm", included: true },
      { key: "featureWorkOrdersHistory", included: true },
      { key: "featureEstimatesAppointments", included: true },
      { key: "featureMechanicReports", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
  {
    key: "complete",
    monthlyPrice: "₮499,000",
    annualPrice: "₮4,990,000",
    annualPerMonth: "₮416,000",
    features: [
      { key: "feature1Branch10Users", included: true },
      { key: "featureEverythingInCore", included: true },
      { key: "featureInventoryManagement", included: true },
      {
        key: "featureMechanicAccountability",
        included: true,
      },
      { key: "featureTelegramMessaging", included: true },
      { key: "featureDashboardAnalytics", included: true },
    ],
    ctaVariant: "default",
    popular: true,
  },
  {
    key: "business",
    monthlyPrice: "₮999,000",
    annualPrice: "₮9,990,000",
    annualPerMonth: "₮833,000",
    features: [
      { key: "feature3Branches25Users", included: true },
      { key: "featureEverythingInPro", included: true },
      { key: "featureMultiBranchDashboard", included: true },
      { key: "featureApiAdvancedBi", included: true },
      { key: "featureAdvancedInventory", included: true },
      { key: "featureDedicatedOnboarding", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
  {
    key: "enterprise",
    monthlyPrice: "from ₮2.49M/mo",
    annualPrice: "From ₮29,880,000",
    annualPerMonth: "",
    features: [
      { key: "featureChainDealerFleet", included: true },
      { key: "featureUnlimitedBranchesUsers", included: true },
      { key: "featureCustomIntegrationsApi", included: true },
      { key: "featureDedicatedInfra", included: true },
      { key: "featureFleetManagement", included: true },
      { key: "featureCustomReporting", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
];

interface ComparisonRow {
  key: string;
  core: string;
  pro: string;
  business: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { key: "featureBranch", core: "1", pro: "1", business: "3+" },
  { key: "featureUsers", core: "3", pro: "10", business: "25+" },
  {
    key: "featureWorkOrders",
    core: "Unlimited",
    pro: "Unlimited",
    business: "Unlimited",
  },
  {
    key: "featureCustomers",
    core: "2,000",
    pro: "20,000",
    business: "100,000",
  },
  { key: "featureStorage", core: "1 GB", pro: "10 GB", business: "50 GB" },
  { key: "featureEstimates", core: "✓", pro: "✓", business: "✓" },
  { key: "featureAppointments", core: "✓", pro: "✓", business: "✓" },
  { key: "featureInventory", core: "—", pro: "✓", business: "✓" },
  { key: "featureMessaging", core: "—", pro: "✓", business: "✓" },
  {
    key: "featureServiceReminders",
    core: "—",
    pro: "✓",
    business: "✓",
  },
  { key: "featurePricingRules", core: "—", pro: "✓", business: "✓" },
  { key: "featurePayroll", core: "—", pro: "✓", business: "✓" },
  { key: "featureApi", core: "—", pro: "—", business: "✓" },
  { key: "featureMultiBranch", core: "—", pro: "—", business: "✓" },
  {
    key: "featureAdvancedInventory",
    core: "—",
    pro: "—",
    business: "✓",
  },
  {
    key: "featureBi",
    core: "Basic",
    pro: "✓",
    business: "Advanced",
  },
  {
    key: "featureReports",
    core: "✓",
    pro: "✓",
    business: "Advanced",
  },
  {
    key: "featureSupport",
    core: "Email",
    pro: "Priority",
    business: "Priority",
  },
  {
    key: "featureOnboarding",
    core: "SelfServe",
    pro: "Guided",
    business: "Dedicated",
  },
];

const FAQ_KEYS: { q: string; a: string }[] = [
  { q: "faqQ1", a: "faqA1" },
  { q: "faqQ2", a: "faqA2" },
  { q: "faqQ3", a: "faqA3" },
  { q: "faqQ4", a: "faqA4" },
  { q: "faqQ5", a: "faqA5" },
  { q: "faqQ6", a: "faqA6" },
];

// Comparison cells that hold a localized word instead of a raw value (number/—/✓)
const VALUE_KEYS: Record<string, true> = {
  Addon: true,
  Advanced: true,
  Basic: true,
  Dedicated: true,
  Email: true,
  Full: true,
  Guided: true,
  Limited: true,
  Priority: true,
  SelfServe: true,
  Unlimited: true,
};

type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function ComparisonCell({
  value,
  t,
  className,
}: {
  value: string;
  t: Translate;
  className?: string;
}) {
  if (VALUE_KEYS[value]) {
    return <span className={className}>{t(`value${value}`)}</span>;
  }
  if (value === "✓") {
    return (
      <span className={className}>
        <Check aria-hidden="true" className="mx-auto size-4 text-emerald-500" />
        <span className="sr-only">{t("valueIncluded")}</span>
      </span>
    );
  }
  if (value === "—") {
    return (
      <span className={className}>
        <X
          aria-hidden="true"
          className="mx-auto size-4 text-muted-foreground/40"
        />
        <span className="sr-only">{t("valueNotIncluded")}</span>
      </span>
    );
  }
  return <span className={className}>{value}</span>;
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PricingContent locale={locale} />;
}

async function PricingContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "pricing",
  })) as Translate;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background" />
            <div className="absolute -top-32 left-[6%] h-[480px] w-[480px] rounded-full bg-[var(--brand-violet-glow)] blur-3xl" />
            <div className="absolute top-[12%] -right-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-teal-glow)] blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-6 gap-2 border-border bg-background px-3 py-1 text-xs font-medium"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              {t("heroBadge")}
            </Badge>
            <Typography.H1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </Typography.H1>
            <Typography.Muted className="mx-auto mt-5 max-w-xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              {t("heroSubtitle")}
            </Typography.Muted>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
                className="w-full shadow-[var(--shadow-brand)] sm:w-auto"
              >
                {t("startTrial")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="mailto:hello@tolom.app" />}
                nativeButton={false}
                className="w-full sm:w-auto"
              >
                {t("contactSales")}
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-4 text-emerald-500" />
                {t("trialCta")}
              </span>
              <span
                aria-hidden="true"
                className="hidden size-1 rounded-full bg-muted-foreground/30 sm:inline-block"
              />
              <span className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-4 text-emerald-500" />
                {t("cancelAnytime")}
              </span>
            </div>
          </div>
        </section>

        {/* ── ROI Section ──────────────────────────────── */}
        <section className="border-b px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <Typography.H2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              {t("roiTitle")}
            </Typography.H2>
            <div className="mt-10 grid overflow-hidden rounded-xl ring-1 ring-border sm:grid-cols-2">
              <div className="bg-destructive/5 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <TrendingDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-destructive"
                  />
                  <Typography.Muted className="text-xs font-semibold tracking-wider text-destructive uppercase">
                    {t("roiBefore")}
                  </Typography.Muted>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-destructive sm:text-4xl">
                  {t("roiBeforeAmount")}
                </div>
                <Typography.Muted className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("roiBeforeDetails")}
                </Typography.Muted>
              </div>
              <div className="bg-primary/5 p-6 sm:border-l sm:border-border sm:p-8">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                  <Typography.Muted className="text-xs font-semibold tracking-wider text-primary uppercase">
                    {t("roiAfter")}
                  </Typography.Muted>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-primary sm:text-4xl">
                  {t("roiAfterAmount")}
                </div>
                <Typography.Muted className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("roiAfterDetails")}
                </Typography.Muted>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards (client-side toggle) ──────────── */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("plansTitle")}
              </Typography.H2>
              <Typography.Muted className="mt-4 text-base text-muted-foreground">
                {t("annualCta")}
              </Typography.Muted>
            </div>
            <PricingCards
              plans={PLAN_DATA}
              translations={{
                monthly: t("monthly"),
                annual: t("annual"),
                toggleLabel: t("toggleLabel"),
                savePercent: t("savePercent"),
                annualSave: t("annualSave"),
                billedAnnually: t("billedAnnually"),
                mostPopular: t("mostPopular"),
                contactSales: t("contactSales"),
                getStarted: t("getStarted"),
                startTrial: t("startTrial"),
                trialCta: t("trialCta"),
                customPrice: t("customPrice"),
                perMonth: t("perMonth"),
                perYear: t("perYear"),
                valueAddon: t("valueAddon"),
                coreName: t("coreName"),
                coreDesc: t("coreDesc"),
                completeName: t("completeName"),
                completeDesc: t("completeDesc"),
                businessName: t("businessName"),
                businessDesc: t("businessDesc"),
                enterpriseName: t("enterpriseName"),
                enterpriseDesc: t("enterpriseDesc"),
                ...Object.fromEntries(
                  PLAN_DATA.flatMap((p) =>
                    p.features.map((f) => [f.key, t(f.key)]),
                  ),
                ),
              }}
            />
          </div>
        </section>

        {/* ── Comparison Table ────────────────────────────────── */}
        <section className="border-t px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <Typography.H2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              {t("compareTitle")}
            </Typography.H2>
            <div className="mt-10 overflow-x-auto rounded-xl ring-1 ring-border">
              <table className="w-full min-w-[560px] text-[15px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-3 pr-4 pl-4 text-left font-medium text-muted-foreground sm:pl-6">
                      {t("feature")}
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground sm:px-4">
                      {t("coreName")}
                    </th>
                    <th className="bg-primary/5 px-3 py-3 text-center sm:px-4">
                      <span className="block font-semibold">
                        {t("completeName")}
                      </span>
                      <Badge
                        variant="secondary"
                        className="mt-1.5 hidden sm:inline-flex"
                      >
                        <Star aria-hidden="true" className="mr-1 size-3" />
                        {t("mostPopular")}
                      </Badge>
                    </th>
                    <th className="py-3 pr-4 pl-3 text-center font-medium text-muted-foreground sm:px-4">
                      {t("businessName")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4 pl-4 font-medium text-muted-foreground sm:pl-6">
                        {t(row.key)}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums sm:px-4">
                        <ComparisonCell value={row.core} t={t} />
                      </td>
                      <td className="bg-primary/5 px-3 py-3 text-center font-medium sm:px-4">
                        <ComparisonCell value={row.pro} t={t} />
                      </td>
                      <td className="py-3 pr-4 pl-3 text-center tabular-nums sm:px-4">
                        <ComparisonCell value={row.business} t={t} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              {t("faqTitle")}
            </Typography.H2>
            <Accordion>
              {FAQ_KEYS.map((item) => (
                <AccordionItem key={item.q}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <HelpCircle
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      {t(item.q)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Typography.Muted className="text-muted-foreground">
                      {t(item.a)}
                    </Typography.Muted>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="border-t px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-muted/20 px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[var(--brand-violet-glow)] blur-3xl" />
              <div className="absolute -right-24 -bottom-32 h-72 w-72 rounded-full bg-[var(--brand-teal-glow)] blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <Typography.H2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {t("ctaTitle")}
              </Typography.H2>
              <Typography.Muted className="mt-4 text-pretty text-muted-foreground">
                {t("ctaSubtitle")}
              </Typography.Muted>
              <div className="mt-8">
                <Button
                  size="lg"
                  render={<Link href="/auth/signup" />}
                  nativeButton={false}
                  className="shadow-[var(--shadow-brand)]"
                >
                  {t("ctaButton")}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
