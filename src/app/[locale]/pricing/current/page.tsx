"use client";

import { ArrowRight, Check, HelpCircle, Star, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
import { cn } from "@/lib/utils";


type FeatureStatus = boolean;

interface PlanFeature {
  text: string;
  included: FeatureStatus;
}

interface PlanData {
  key: string;
  monthlyPrice: string;
  annualPrice: string;
  annualPerMonth: string;
  features: PlanFeature[];
  ctaVariant: "default" | "outline";
  popular: boolean;
}

const PLAN_DATA: PlanData[] = [
  {
    key: "core",
    monthlyPrice: "₮299,000",
    annualPrice: "₮2,990,000",
    annualPerMonth: "₮249,000",
    features: [
      { text: "1 branch", included: true },
      { text: "3 users", included: true },
      { text: "300 work orders / month", included: true },
      { text: "1,000 customer records", included: true },
      { text: "1 GB storage", included: true },
      { text: "Tablet-first workflow", included: true },
      { text: "Customer & vehicle CRM", included: true },
      { text: "Work orders & service history", included: true },
      { text: "Service catalog & pricing memory", included: true },
      { text: "Service summary & totals review", included: true },
      { text: "Mechanic daily / weekly / monthly reports", included: true },
      { text: "Dashboard with KPI metrics", included: true },
      { text: "Revenue charts & trends", included: true },
      { text: "Recent work orders table", included: true },
      { text: "Bay view board", included: true },
      { text: "Vehicle models catalog", included: true },
      { text: "Multi-tenant data isolation", included: true },
      { text: "Email support", included: true },
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
      { text: "1 branch", included: true },
      { text: "10 users", included: true },
      { text: "1,500 work orders / month", included: true },
      { text: "10,000 customer records", included: true },
      { text: "10 GB storage", included: true },
      { text: "Everything in Core", included: true },
      { text: "Inventory management", included: true },
      { text: "Parts catalog & categories", included: true },
      { text: "Stock movement ledger", included: true },
      { text: "Low-stock alerts & thresholds", included: true },
      { text: "Supplier management", included: true },
      { text: "Purchase orders & receiving", included: true },
      { text: "Advanced reports & analytics", included: true },
      { text: "Revenue & service mix charts", included: true },
      { text: "Finance dashboard", included: true },
      { text: "Organization settings & roles", included: true },
      { text: "Excel / CSV export", included: true },
      { text: "Priority support", included: true },
    ],
    ctaVariant: "default",
    popular: true,
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
  if (status) {
    return <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />;
  }
  return <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/30" />;
}

export default function PricingCurrentPage() {
  const t = useTranslations("pricingCurrent");
  const appT = useTranslations("app");
  const authT = useTranslations("auth");
  const [annual, setAnnual] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Top Navigation ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-xs">
              <Wrench className="size-4 text-primary-foreground" />
            </div>
            <span>{appT("name")}</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/pricing" />}
            >
              {t("viewGoalPricing")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/auth/login" />}
            >
              {authT("signIn")}
            </Button>
            <Button size="sm" render={<Link href="/auth/signup" />}>
              {authT("signUp")}
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <Badge variant="outline" className="text-xs font-medium">
              {t("badge")}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>

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

      {/* ── Pricing Cards ───────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2 lg:gap-8">
          {PLAN_DATA.map((plan) => {
            const price = annual
              ? `${plan.annualPrice}/жил`
              : `${plan.monthlyPrice}/сар`;
            const perUnit = annual ? `${plan.annualPerMonth}/сар` : null;

            return (
              <Card
                key={plan.key}
                size="sm"
                className={cn(
                  "relative flex flex-col",
                  plan.popular && "ring-2 ring-primary shadow-md",
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
                      <p className="mt-1 text-xs text-muted-foreground">
                        {perUnit} {t("monthly").toLowerCase()}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((f, i) => (
                      <li key={`feature-${i}`} className="flex items-start gap-2 text-sm">
                        <FeatureIcon status={f.included} />
                        <span
                          className={
                            f.included ? "" : "text-muted-foreground/50"
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
                    render={<Link href="/auth/signup" />}
                  >
                    {t("startTrial")}
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Enterprise ──────────────────────────────────────── */}
      <section className="border-t bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("enterpriseTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("enterpriseDesc")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:text-left">
            {[1, 2, 3, 4].map((i) => (
              <div key={`item-${i}`} className="flex items-center gap-2 text-sm">
                <Check className="size-4 shrink-0 text-emerald-500" />
                <span>{t(`enterpriseFeature${i}`)}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button size="lg" render={<Link href="/auth/signup" />}>
              {t("enterpriseCta")}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── What's Coming Next ──────────────────────────────── */}
      <section className="border-t px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("comingTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("comingSubtitle")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:text-left">
            {[2, 3, 4, 5, 6].map((i) => (
              <div key={`item-${i}`} className="flex items-center gap-2 text-sm">
                <Check className="size-4 shrink-0 text-muted-foreground/40" />
                <span className="text-muted-foreground">
                  {t(`comingItem${i}`)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/pricing" />}
            >
              {t("viewGoalPricing")}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="border-t bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("faqTitle")}
          </h2>
          <Accordion>
            {FAQ_KEYS.map((item, i) => (
              <AccordionItem key={`faq-${i}`}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                    {t(item.q)}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{t(item.a)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("ctaTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("ctaSubtitle")}</p>
          <div className="mt-8">
            <Button size="lg" render={<Link href="/auth/signup" />}>
              {t("ctaButton")}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t bg-background px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2">
            <Wrench className="size-3" />
            <span className="font-semibold text-foreground">
              {appT("name")}
            </span>
          </div>
          <p className="mt-2">{appT("tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
