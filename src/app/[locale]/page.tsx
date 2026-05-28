"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardList,
  Code2,
  LineChart,
  MessageSquareText,
  Package,
  Star,
  Store,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LandingNav } from "@/components/landing-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PartnersSlider } from "@/components/partners-slider";
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
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

const FEATURES = [
  {
    key: "featureWorkOrders",
    icon: ClipboardList,
    gradient: "from-blue-500/20 to-blue-600/10",
  },
  {
    key: "featureInventory",
    icon: Package,
    gradient: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    key: "featureCustomers",
    icon: Users,
    gradient: "from-violet-500/20 to-violet-600/10",
  },
  {
    key: "featurePricing",
    icon: Tag,
    gradient: "from-amber-500/20 to-amber-600/10",
  },
  {
    key: "featureReports",
    icon: BarChart3,
    gradient: "from-rose-500/20 to-rose-600/10",
  },
  {
    key: "featureAnalytics",
    icon: LineChart,
    gradient: "from-cyan-500/20 to-cyan-600/10",
  },
  {
    key: "featureMultiBranch",
    icon: Store,
    gradient: "from-indigo-500/20 to-indigo-600/10",
  },
  {
    key: "featureSms",
    icon: MessageSquareText,
    gradient: "from-orange-500/20 to-orange-600/10",
  },
  {
    key: "featureApi",
    icon: Code2,
    gradient: "from-teal-500/20 to-teal-600/10",
  },
];

const STEPS = [
  { key: "step1", icon: ClipboardList },
  { key: "step2", icon: Wrench },
  { key: "step3", icon: Check },
];

const WORKFLOW_PILLARS = [
  { key: 'workflowFrontDesk', icon: ClipboardList },
  { key: 'workflowWorkshop', icon: Wrench },
  { key: 'workflowManagement', icon: LineChart },
];

const DIFFERENTIATORS = [
  { key: 'differenceTablet', icon: Check },
  { key: 'differencePricing', icon: Tag },
  { key: 'differenceVisibility', icon: Users },
  { key: 'differenceScalability', icon: Store },
];

const PRICING_TIERS = [
  { key: "pricingTier1", popular: false },
  { key: "pricingTier2", popular: true },
  { key: "pricingTier3", popular: false },
];

export default function HomePage() {
  const t = useTranslations("home");
  const appT = useTranslations("app");
  const _authT = useTranslations("auth");
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalWorkOrders: number;
    totalCustomers: number;
    totalVehicles: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        {/* ═══ Hero ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background" />
            <div className="absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 text-xs font-medium">
              {appT("tagline")}
            </Badge>
            <Typography.H1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </Typography.H1>
            <Typography.Muted className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t("heroSubtitle")}
            </Typography.Muted>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
                className="w-full sm:w-auto"
              >
                {t("heroCtaPrimary")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="#features" />}
                nativeButton={false}
                className="w-full sm:w-auto"
              >
                {t("heroCtaSecondary")}
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t pt-8 sm:mt-16 sm:pt-10">
              {[1, 2, 3].map((i) => {
                const value =
                  i === 1
                    ? stats?.totalWorkOrders
                    : i === 2
                      ? stats?.totalCustomers
                      : stats?.totalVehicles;
                return (
                  <div key={i} className="text-center">
                    {statsLoading || value === undefined ? (
                      <>
                        <Skeleton className="mx-auto h-9 w-20 sm:h-10" />
                        <Skeleton className="mx-auto mt-2 h-4 w-24" />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                          {value.toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {t(`heroStats${i}`)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PartnersSlider />

        {/* ═══ Features ═══════════════════════════════════════ */}
        <section
          id="features"
          className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("featuresTitle")}
              </Typography.H2>
              <Typography.Muted className="mt-4 text-muted-foreground">
                {t("featuresSubtitle")}
              </Typography.Muted>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.key}
                    className="group relative overflow-hidden border transition-shadow hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100",
                        "bg-gradient-to-br",
                        feature.gradient,
                      )}
                    />
                    <CardHeader>
                      <div className="flex size-10 items-center justify-center rounded-lg border bg-background shadow-xs">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <CardTitle className="mt-3 text-base">
                        {t(`${feature.key}`)}
                      </CardTitle>
                      <CardDescription>
                        {t(`${feature.key}Desc`)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ How It Works ═══════════════════════════════════ */}
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
                    {/* Connector line */}
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

        {/* ═══ Workflow Details ═══════════════════════════════ */}
        <section className="border-t px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline">{t('workflowEyebrow')}</Badge>
              <Typography.H2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('workflowTitle')}
              </Typography.H2>
              <Typography.Muted className="mt-4 text-muted-foreground">
                {t('workflowSubtitle')}
              </Typography.Muted>
              <Typography.Muted className="mt-4 text-sm leading-6 text-muted-foreground">
                {t('workflowBody')}
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
                      <CardDescription>
                        {t(`${pillar.key}Desc`)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pt-0">
                      {[1, 2, 3].map((item) => (
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

        {/* ═══ Differentiators ════════════════════════════════ */}
        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline">{t('differenceEyebrow')}</Badge>
              <Typography.H2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('differenceTitle')}
              </Typography.H2>
              <Typography.Muted className="mt-4 text-muted-foreground">
                {t('differenceSubtitle')}
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

        {/* ═══ Testimonials ═══════════════════════════════════ */}
        <section className="border-b px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <Typography.H2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              {t("testimonialsTitle")}
            </Typography.H2>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
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

        {/* ═══ Pricing Preview ═════════════════════════════════ */}
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
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {PRICING_TIERS.map((tier) => {
                const name = t(`${tier.key}Name`);
                const price = t(`${tier.key}Price`);
                const desc = t(`${tier.key}Desc`);

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
                          {price}
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

        {/* ═══ CTA ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-t px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
            <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("ctaTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-4 text-muted-foreground">{t("ctaSubtitle")}</Typography.Muted>
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
      </main>

      {/* ═══ Footer ═══════════════════════════════════════════ */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-xs">
                  <Wrench className="size-4 text-primary-foreground" />
                </div>
                <span>{appT("name")}</span>
              </Link>
              <Typography.Muted className="text-xs text-muted-foreground">
                {t("footerTagline")}
              </Typography.Muted>
              <div className="mt-2">
                <LocaleSwitcher />
              </div>
            </div>

            {/* Product */}
            <div className="flex flex-col gap-3">
              <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footerProduct")}
              </Typography.H4>
              <ul className="flex flex-col gap-2">
                {["Features", "Pricing", "Integrations"].map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "Pricing"
                          ? "/pricing"
                          : item === "Integrations"
                            ? "/integrations"
                            : "#features"
                      }
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`footerProduct${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-3">
              <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footerCompany")}
              </Typography.H4>
              <ul className="flex flex-col gap-2">
                {["About", "Blog", "Contact"].map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "About"
                          ? "/about"
                          : item === "Blog"
                            ? "/blog"
                            : "/auth/login"
                      }
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`footerCompany${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-3">
              <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footerSupport")}
              </Typography.H4>
              <ul className="flex flex-col gap-2">
                {["Docs", "FAQ", "Status"].map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "FAQ"
                          ? "/faq"
                          : item === "Status"
                            ? "/status"
                            : item === "Docs"
                              ? "/guide"
                              : "/auth/login"
                      }
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`footerSupport${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
            {t("footerCopyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
