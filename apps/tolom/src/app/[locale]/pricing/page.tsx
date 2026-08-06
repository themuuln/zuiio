import { ArrowRight, HelpCircle } from "lucide-react";
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
    key: "business",
    monthlyPrice: "₮1,790,000",
    annualPrice: "₮17,900,000",
    annualPerMonth: "₮1,492,000",
    features: [
      { key: "feature3Branches25Users", included: true },
      { key: "featureEverythingInPro", included: true },
      { key: "featureMultiBranchDashboard", included: true },
      { key: "featureApiAdvancedBi", included: true },
      { key: "featureCustomInvoiceTemplates", included: true },
      { key: "featureDedicatedOnboarding", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
  {
    key: "complete",
    monthlyPrice: "₮699,000",
    annualPrice: "₮6,990,000",
    annualPerMonth: "₮583,000",
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
    key: "core",
    monthlyPrice: "₮299,000",
    annualPrice: "₮2,990,000",
    annualPerMonth: "₮249,000",
    features: [
      { key: "feature1Branch3Users", included: true },
      { key: "featureTabletWorkflow", included: true },
      { key: "featureCustomerVehicleCrm", included: true },
      { key: "featureWorkOrdersHistory", included: true },
      { key: "featureMechanicReports", included: true },
      { key: "featureBasicReports", included: true },
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
  { key: "featureBranch", core: "1", pro: "1", business: "3" },
  { key: "featureUsers", core: "3", pro: "10", business: "25" },
  {
    key: "featureWorkOrders",
    core: "300",
    pro: "1,500",
    business: "5,000",
  },
  {
    key: "featureCustomers",
    core: "1,000",
    pro: "10,000",
    business: "50,000",
  },
  { key: "featureStorage", core: "1 GB", pro: "10 GB", business: "50 GB" },
  { key: "featureInventory", core: "—", pro: "✓", business: "✓" },
  { key: "featureMessaging", core: "—", pro: "✓", business: "✓" },
  { key: "featureApi", core: "—", pro: "—", business: "✓" },
  { key: "featureMultiBranch", core: "—", pro: "—", business: "✓" },
  {
    key: "featureBi",
    core: "—",
    pro: "Basic",
    business: "Advanced",
  },
  {
    key: "featureReports",
    core: "—",
    pro: "—",
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
    core: "Basic",
    pro: "Full",
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
const VALUE_KEYS = new Set([
  "Addon",
  "Advanced",
  "Basic",
  "Dedicated",
  "Email",
  "Full",
  "Limited",
  "Priority",
  "Unlimited",
]);

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
  })) as (key: string, values?: Record<string, string | number>) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-3xl">
            <Typography.H1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {t("heroTitle")}
            </Typography.H1>
            <Typography.Muted className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t("heroSubtitle")}
            </Typography.Muted>

            {/* Hero subtitle only — toggle + cards rendered client-side */}
            <p className="mt-6 text-sm text-muted-foreground">
              {t("annualCta")}
            </p>
          </div>
        </section>

        {/* ── ROI Section ──────────────────────────────── */}
        <section className="border-b bg-gradient-to-r from-destructive/5 via-destructive/[3%] to-background px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Typography.H2 className="mb-6 text-center text-xl font-semibold tracking-tight sm:text-2xl">
              {t("roiTitle")}
            </Typography.H2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
                <Typography.Muted className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  {t("roiBefore")}
                </Typography.Muted>
                <Typography.H3 className="mt-2 text-2xl font-bold text-destructive sm:text-3xl">
                  {t("roiBeforeAmount")}
                </Typography.H3>
                <Typography.Text className="mt-1 text-sm text-muted-foreground">
                  {t("roiBeforeDetails")}
                </Typography.Text>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
                <Typography.Muted className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {t("roiAfter")}
                </Typography.Muted>
                <Typography.H3 className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">
                  {t("roiAfterAmount")}
                </Typography.H3>
                <Typography.Text className="mt-1 text-sm text-muted-foreground">
                  {t("roiAfterDetails")}
                </Typography.Text>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards (client-side toggle) ──────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <PricingCards
            plans={PLAN_DATA}
            translations={{
              monthly: t("monthly"),
              annual: t("annual"),
              savePercent: t("savePercent"),
              annualSave: t("annualSave"),
              mostPopular: t("mostPopular"),
              contactSales: t("contactSales"),
              getStarted: t("getStarted"),
              startTrial: t("startTrial"),
              trialCta: t("trialCta"),
              customPrice: t("customPrice"),
              perMonth: t("perMonth"),
              perYear: t("perYear"),
              valueAddon: t("valueAddon"),
              starterName: t("coreName"),
              starterDesc: t("coreDesc"),
              proName: t("completeName"),
              proDesc: t("completeDesc"),
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
        </section>

        {/* ── Comparison Table ────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <Typography.H2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("compareTitle")}
            </Typography.H2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      className="pb-3 pr-4 font-medium text-muted-foreground"
                      aria-label={t("feature")}
                    />
                    <th className="pb-3 px-4 font-medium text-muted-foreground">
                      {t("coreName")}
                    </th>
                    <th className="pb-3 px-4 font-semibold">
                      {t("completeName")}
                    </th>
                    <th className="pb-3 pl-4 font-medium text-muted-foreground">
                      {t("businessName")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">
                        {t(row.key)}
                      </td>
                      <td className="py-3 px-4">
                        {VALUE_KEYS.has(row.core)
                          ? t(`value${row.core}`)
                          : row.core}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {VALUE_KEYS.has(row.pro)
                          ? t(`value${row.pro}`)
                          : row.pro}
                      </td>
                      <td className="py-3 pl-4">
                        {VALUE_KEYS.has(row.business)
                          ? t(`value${row.business}`)
                          : row.business}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="border-t bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("faqTitle")}
            </Typography.H2>
            <Accordion>
              {FAQ_KEYS.map((item) => (
                <AccordionItem key={item.q}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
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
        <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("ctaTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-3 text-muted-foreground">
              {t("ctaSubtitle")}
            </Typography.Muted>
            <div className="mt-8">
              <Button size="lg" render={<Link href="/auth/signup" />}>
                {t("ctaButton")}
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
