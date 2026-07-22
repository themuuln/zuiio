"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardList,
  LineChart,
  Star,
  Store,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "step1", icon: ClipboardList },
  { key: "step2", icon: Wrench },
  { key: "step3", icon: Check },
] as const;

const WORKFLOW_PILLARS = [
  { key: "workflowFrontDesk", icon: ClipboardList },
  { key: "workflowWorkshop", icon: Wrench },
  { key: "workflowManagement", icon: LineChart },
] as const;

const DIFFERENTIATORS = [
  { key: "differenceTablet", icon: Check },
  { key: "differencePricing", icon: Tag },
  { key: "differenceVisibility", icon: Users },
  { key: "differenceScalability", icon: Store },
] as const;

const PRICING_TIERS = [
  { key: "pricingTier1", popular: false },
  { key: "pricingTier2", popular: true },
  { key: "pricingTier3", popular: false },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("howItWorksTitle")}
          </Typography.H2>
          <Typography.Muted className="mt-4 text-muted-foreground">
            {t("howItWorksSubtitle")}
          </Typography.Muted>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute top-8 left-[60%] hidden w-[80%] border-t border-dashed border-muted-foreground/20 md:block" />
                )}
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="size-7 text-primary" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="mb-2">
                    {String(i + 1).padStart(2, "0")}
                  </Badge>
                  <Typography.H3 className="text-lg font-semibold">
                    {t(`${step.key}Title`)}
                  </Typography.H3>
                  <Typography.Muted className="mt-2 text-sm text-muted-foreground">
                    {t(`${step.key}Desc`)}
                  </Typography.Muted>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WorkflowSection() {
  const t = useTranslations("home");

  return (
    <section className="border-t px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline">{t("workflowEyebrow")}</Badge>
          <Typography.H2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("workflowTitle")}
          </Typography.H2>
          <Typography.Muted className="mt-4 text-muted-foreground">
            {t("workflowSubtitle")}
          </Typography.Muted>
          <Typography.Muted className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("workflowBody")}
          </Typography.Muted>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {WORKFLOW_PILLARS.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <Card key={pillar.key} className="flex h-full flex-col">
                <CardHeader className="gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">
                    {t(`${pillar.key}Title`)}
                  </CardTitle>
                  <CardDescription>{t(`${pillar.key}Desc`)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  {([1, 2, 3] as const).map((item) => (
                    <div key={item} className="flex gap-3">
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="size-3 text-primary" />
                      </div>
                      <Typography.Muted className="text-sm text-muted-foreground">
                        {t(`${pillar.key}Point${item}`)}
                      </Typography.Muted>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DifferentiatorsSection() {
  const t = useTranslations("home");

  return (
    <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline">{t("differenceEyebrow")}</Badge>
          <Typography.H2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("differenceTitle")}
          </Typography.H2>
          <Typography.Muted className="mt-4 text-muted-foreground">
            {t("differenceSubtitle")}
          </Typography.Muted>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {DIFFERENTIATORS.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.key} className="h-full">
                <CardHeader className="gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border bg-background shadow-xs">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`${item.key}Title`)}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {t(`${item.key}Desc`)}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const t = useTranslations("home");

  return (
    <section className="border-b px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Typography.H2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {t("testimonialsTitle")}
        </Typography.H2>
        <div className="grid gap-6 md:grid-cols-2">
          {([1, 2] as const).map((i) => (
            <Card key={i} className="relative">
              <CardHeader>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="size-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t(`testimonial${i}`)}&rdquo;
                </blockquote>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {t(`testimonial${i}Author`).charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {t(`testimonial${i}Author`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(`testimonial${i}Role`)}
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const MONTHLY_PRICES = [299000, 699000, 1590000];

export function PricingSection() {
  const t = useTranslations("home");
  const [annual, setAnnual] = useState(false);

  return (
    <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("pricingPreviewTitle")}
          </Typography.H2>
          <Typography.Muted className="mt-4 text-muted-foreground">
            {t("pricingPreviewSubtitle")}
          </Typography.Muted>
        </div>
        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={cn(
              "text-sm transition-colors",
              !annual && "font-medium text-foreground",
              annual && "text-muted-foreground",
            )}
          >
            {t("pricingMonthly")}
          </span>
          <Switch
            checked={annual}
            onCheckedChange={setAnnual}
            aria-label="Toggle annual billing"
          />
          <span
            className={cn(
              "text-sm transition-colors",
              annual && "font-medium text-foreground",
              !annual && "text-muted-foreground",
            )}
          >
            {t("pricingAnnual")}
          </span>
          {annual && (
            <Badge variant="default" className="ml-1 whitespace-nowrap text-xs">
              {t("pricingSavePercent")}
            </Badge>
          )}
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, index) => {
            const name = t(`${tier.key}Name`);
            const price = t(`${tier.key}Price`);
            const desc = t(`${tier.key}Desc`);
            const monthlyPrice = MONTHLY_PRICES[index];
            const annualPrice = Math.round(monthlyPrice * 12 * 0.8);

            return (
              <Card
                key={tier.key}
                className={cn(
                  "relative flex flex-col overflow-visible pt-2",
                  tier.popular && "ring-2 ring-primary shadow-md",
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <Badge className="pointer-events-none whitespace-nowrap bg-primary text-primary-foreground">
                      <Star className="mr-1 size-3" />
                      {t("pricingMostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold tracking-tight">
                      {annual ? `₮${annualPrice.toLocaleString()}/yr` : price}
                    </span>
                  </div>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full"
                    render={<Link href="/auth/signup" />}
                    nativeButton={false}
                  >
                    {t("pricingCta")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("pricingEnterprise")}
          </Typography.Muted>
          <Button
            variant="link"
            render={<Link href="/pricing" />}
            nativeButton={false}
            className="mt-2"
          >
            {t("pricingFullLink")}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden border-t px-4 py-20 text-center sm:px-6 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-2xl">
        <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("ctaTitle")}
        </Typography.H2>
        <Typography.Muted className="mt-4 text-muted-foreground">
          {t("ctaSubtitle")}
        </Typography.Muted>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            render={<Link href="/auth/signup" />}
            nativeButton={false}
            className="w-full sm:w-auto"
          >
            {t("ctaButton")}
            <ArrowUpRight className="ml-2 size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/pricing" />}
            nativeButton={false}
            className="w-full sm:w-auto"
          >
            {t("navPricing")}
          </Button>
        </div>
      </div>
    </section>
  );
}
