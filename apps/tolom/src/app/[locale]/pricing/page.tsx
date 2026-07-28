import { ArrowRight, Check, HelpCircle, X } from "lucide-react";
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
  text: string;
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
    key: "enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    annualPerMonth: "",
    features: [
      { text: "For chains, dealerships & fleets", included: true },
      { text: "Unlimited branches & users", included: true },
      { text: "Custom integrations & API access", included: true },
      { text: "Dedicated database & infra options", included: true },
      { text: "Fleet management module", included: true },
      { text: "Custom reporting & priority SLA", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
  {
    key: "business",
    monthlyPrice: "₮1,590,000",
    annualPrice: "₮15,900,000",
    annualPerMonth: "₮1,325,000",
    features: [
      { text: "3 branches · 25 users · 5,000 WOs/mo", included: true },
      { text: "Everything in Pro", included: true },
      { text: "Multi-branch dashboard & inventory transfer", included: true },
      { text: "API access & advanced BI", included: true },
      { text: "Custom invoice templates", included: true },
      { text: "Dedicated onboarding specialist", included: true },
    ],
    ctaVariant: "outline",
    popular: false,
  },
  {
    key: "pro",
    monthlyPrice: "₮699,000",
    annualPrice: "₮6,990,000",
    annualPerMonth: "₮583,000",
    features: [
      { text: "1 branch · 10 users · 1,500 WOs/mo", included: true },
      { text: "Tablet-first workflow & CRM", included: true },
      { text: "Inventory management & stock control", included: true },
      {
        text: "Mechanic accountability & performance tracking",
        included: true,
      },
      { text: "Telegram messaging & customer retention", included: true },
      { text: "Dashboard analytics & priority support", included: true },
    ],
    ctaVariant: "default",
    popular: true,
  },
  {
    key: "starter",
    monthlyPrice: "₮299,000",
    annualPrice: "₮2,990,000",
    annualPerMonth: "₮249,000",
    features: [
      { text: "1 branch · 3 users · 300 WOs/mo", included: true },
      { text: "Tablet-first workflow", included: true },
      { text: "Customer & vehicle CRM", included: true },
      { text: "Work orders & service history", included: true },
      { text: "Mechanic reports & pricing memory", included: true },
      { text: "Basic reports & email support", included: true },
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

function _FeatureIcon({ status }: { status: FeatureStatus }) {
  if (status === true) {
    return <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />;
  }
  if (status === "addon") {
    return (
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
        $
      </span>
    );
  }
  return <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/30" />;
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
              {t("monthly")} / {t("annual")} — {t("savePercent")}
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
                  ₮3M – ₮15M / month
                </Typography.H3>
                <Typography.Text className="mt-1 text-sm text-muted-foreground">
                  Lost work orders · Inventory leakage · Unpaid invoices ·
                  Untracked mechanics
                </Typography.Text>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
                <Typography.Muted className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {t("roiAfter")}
                </Typography.Muted>
                <Typography.H3 className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">
                  ₮699,000 / month
                </Typography.H3>
                <Typography.Text className="mt-1 text-sm text-muted-foreground">
                  Full visibility · Mechanic accountability · Inventory control
                  · Repeat customers
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
              mostPopular: t("mostPopular"),
              contactSales: t("contactSales"),
              getStarted: t("getStarted"),
              startTrial: t("startTrial"),
              starterName: t("starterName"),
              starterDesc: t("starterDesc"),
              proName: t("proName"),
              proDesc: t("proDesc"),
              businessName: t("businessName"),
              businessDesc: t("businessDesc"),
              enterpriseName: t("enterpriseName"),
              enterpriseDesc: t("enterpriseDesc"),
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
                      {t("starterName")}
                    </th>
                    <th className="pb-3 px-4 font-semibold">{t("proName")}</th>
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
                      <td className="py-3 px-4">{row.core}</td>
                      <td className="py-3 px-4 font-medium">{row.pro}</td>
                      <td className="py-3 pl-4">{row.business}</td>
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
