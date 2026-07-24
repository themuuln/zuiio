"use client";

import { ArrowRight, Check, HelpCircle, Star, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LandingNav } from "@/components/landing-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

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

function FeatureIcon({ status }: { status: FeatureStatus }) {
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

export default function PricingPage() {
  const t = useTranslations("pricing");
  const appT = useTranslations("app");

  const [annual, setAnnual] = useState(false);

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

            {/* Billing toggle */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant={!annual ? "default" : "outline"}
                onClick={() => setAnnual(false)}
              >
                {t("monthly")}
              </Button>
              <Button
                variant={annual ? "default" : "outline"}
                onClick={() => setAnnual(true)}
              >
                {t("annual")}
              </Button>
              <Badge variant="outline" className="text-xs">
                {t("savePercent")}
              </Badge>
            </div>
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

        {/* ── Pricing Cards ───────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 lg:grid-cols-4">
            {PLAN_DATA.map((plan) => {
              const price = annual
                ? `${plan.annualPrice}/жил`
                : `${plan.monthlyPrice}/сар`;
              const perUnit =
                annual && plan.annualPerMonth
                  ? `${plan.annualPerMonth}/сар`
                  : null;
              const isStarter = plan.key === "starter";
              const isEnterprise = plan.key === "enterprise";

              return (
                <Card
                  key={plan.key}
                  size="sm"
                  className={cn(
                    "relative flex flex-col",
                    plan.popular
                      ? "overflow-visible ring-2 ring-primary shadow-md"
                      : isEnterprise
                        ? "border-dashed border-muted-foreground/30"
                        : "",
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="pointer-events-none whitespace-nowrap bg-primary text-primary-foreground">
                        <Star className="mr-1 size-3" />
                        {t("mostPopular")}
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t(`${plan.key}Name`)}
                    </CardTitle>
                    <CardDescription>{t(`${plan.key}Desc`)}</CardDescription>

                    <div className="mt-4">
                      <span className="text-3xl font-semibold tracking-tight">
                        {price}
                      </span>
                      {perUnit && (
                        <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                          {perUnit} {t("monthly").toLowerCase()}
                        </Typography.Muted>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="flex flex-col gap-2.5">
                      {plan.features.map((f) => (
                        <li
                          key={f.text}
                          className="flex items-start gap-2 text-sm"
                        >
                          <FeatureIcon status={f.included} />
                          <span
                            className={
                              f.included
                                ? ""
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="flex-col gap-2">
                    <Button
                      variant={plan.ctaVariant}
                      className="w-full"
                      render={
                        <Link
                          href={isEnterprise ? "/contact" : "/auth/signup"}
                        />
                      }
                    >
                      {isEnterprise
                        ? t("contactSales")
                        : t(isStarter ? "getStarted" : "startTrial")}
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
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
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t bg-background px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2">
            <Wrench className="size-3" />
            <span className="font-semibold text-foreground">
              {appT("name")}
            </span>
          </div>
          <Typography.Text className="mt-2">{appT("tagline")}</Typography.Text>
        </div>
      </footer>
    </div>
  );
}
