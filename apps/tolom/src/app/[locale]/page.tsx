import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  Code2,
  CreditCard,
  Hash,
  Languages,
  MessageCircle,
  MessageSquareText,
  Package,
  ShieldCheck,
  Sparkles,
  Tablet,
  TrendingUp,
  Users,
} from "lucide-react";
import { cacheLife } from "next/cache";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimatedCounter } from "@/components/animated-counter";
import { LandingNav } from "@/components/landing-nav";
import { PartnersSlider } from "@/components/partners-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { HomeClientContent } from "./_home-client";
import { LandingProductPreview } from "./_landing-product-preview";

// Lazy-load below-the-fold sections — they only load when scrolled into view
const HowItWorksSection = dynamic(
  () => import("./_landing-sections").then((m) => m.HowItWorksSection),
  {
    loading: () => (
      <div className="h-48 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const WorkflowSection = dynamic(
  () => import("./_landing-sections").then((m) => m.WorkflowSection),
  {
    loading: () => (
      <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const DifferentiatorsSection = dynamic(
  () => import("./_landing-sections").then((m) => m.DifferentiatorsSection),
  {
    loading: () => (
      <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const TestimonialsSection = dynamic(
  () => import("./_landing-sections").then((m) => m.TestimonialsSection),
  {
    loading: () => (
      <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const PricingSection = dynamic(
  () => import("./_landing-sections").then((m) => m.PricingSection),
  {
    loading: () => (
      <div className="h-96 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const CtaSection = dynamic(
  () => import("./_landing-sections").then((m) => m.CtaSection),
  {
    loading: () => (
      <div className="h-48 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);
const LandingFooter = dynamic(
  () => import("./_landing-footer").then((m) => m.LandingFooter),
  {
    loading: () => (
      <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
);

const FEATURES = [
  {
    key: "featureWorkOrders",
    icon: ClipboardList,
    gradient: "from-blue-500/20 to-blue-600/10",
    accentColor: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "featureInventory",
    icon: Package,
    gradient: "from-emerald-500/20 to-emerald-600/10",
    accentColor: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "featureCustomers",
    icon: Users,
    gradient: "from-sky-500/20 to-sky-600/10",
    accentColor: "bg-sky-500/10 text-sky-600",
  },
  {
    key: "featurePricing",
    icon: Sparkles,
    gradient: "from-amber-500/20 to-amber-600/10",
    accentColor: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "featureReports",
    icon: BarChart3,
    gradient: "from-rose-500/20 to-rose-600/10",
    accentColor: "bg-rose-500/10 text-rose-600",
  },
  {
    key: "featureAnalytics",
    icon: TrendingUp,
    gradient: "from-violet-500/20 to-violet-600/10",
    accentColor: "bg-violet-500/10 text-violet-600",
  },
  {
    key: "featureMultiBranch",
    icon: Building2,
    gradient: "from-slate-500/20 to-slate-600/10",
    accentColor: "bg-slate-500/10 text-slate-600",
  },
  {
    key: "featureChatbot",
    icon: MessageSquareText,
    gradient: "from-orange-500/20 to-orange-600/10",
    accentColor: "bg-orange-500/10 text-orange-600",
  },
  {
    key: "featureApi",
    icon: Code2,
    gradient: "from-teal-500/20 to-teal-600/10",
    accentColor: "bg-teal-500/10 text-teal-600",
  },
];

const TRUST_ITEMS = [
  {
    key: "trustCompliance",
    icon: ShieldCheck,
    accentColor: "text-emerald-500",
  },
  { key: "trustPayments", icon: CreditCard, accentColor: "text-primary" },
  { key: "trustPlates", icon: Hash, accentColor: "text-sky-500" },
  {
    key: "trustNotifications",
    icon: MessageCircle,
    accentColor: "text-blue-500",
  },
  { key: "trustLanguage", icon: Languages, accentColor: "text-amber-500" },
  { key: "trustTablet", icon: Tablet, accentColor: "text-violet-500" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}

async function HomeContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "home",
  })) as (key: string, values?: Record<string, string | number>) => string;
  const appT = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "app",
  })) as (key: string, values?: Record<string, string | number>) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <HomeClientContent />
      <LandingNav />

      <main>
        {/* ═══ Hero ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background" />
            <div className="absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:gap-16">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-6 text-xs font-medium">
                {appT("tagline")}
              </Badge>
              <Typography.H1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </Typography.H1>
              <Typography.Muted className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t("heroSubtitle")}
              </Typography.Muted>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            </div>

            <LandingProductPreview
              appName={appT("name")}
              title={t("productPreviewTitle")}
              liveLabel={t("productPreviewLive")}
              openJobsLabel={t("productPreviewOpenJobs")}
              readyLabel={t("productPreviewReady")}
              revenueLabel={t("productPreviewRevenue")}
              workOrdersLabel={t("featureWorkOrders")}
              customersLabel={t("featureCustomers")}
              inventoryLabel={t("featureInventory")}
              workOrderDetail={t("productPreviewWorkOrderDetail")}
              customerDetail={t("productPreviewCustomerDetail")}
              inventoryDetail={t("productPreviewInventoryDetail")}
              inProgressLabel={t("productPreviewInProgress")}
              readyStatusLabel={t("productPreviewReadyStatus")}
              awaitingLabel={t("productPreviewAwaiting")}
              viewAllLabel={t("productPreviewViewAll")}
            />
          </div>

          {/* Social proof */}
          <div className="mx-auto mt-14 grid max-w-6xl grid-cols-3 gap-6 border-t pt-8 sm:mt-16 sm:gap-8 sm:pt-10">
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                <AnimatedCounter end={12} suffix="+" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t("heroSocialShops")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                <AnimatedCounter end={130} suffix="+" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t("heroSocialVehicles")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                <AnimatedCounter end={98} suffix="%" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t("heroSocialSatisfaction")}
              </div>
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
                      <div
                        className={cn(
                          "flex size-14 items-center justify-center rounded-xl",
                          feature.accentColor,
                        )}
                      >
                        <Icon className="size-7" />
                      </div>
                      <CardTitle className="mt-4 text-base">
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

        {/* ═══ Mongolian trust badges ════════════════════════ */}
        <section className="border-t bg-muted/20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <Typography.Muted className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t("trustTitle")}
            </Typography.Muted>
            <div className="flex flex-wrap justify-center gap-3">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Badge
                    key={item.key}
                    variant="outline"
                    className="gap-1.5 px-3.5 py-1.5 text-sm font-normal"
                  >
                    <Icon className={`size-3.5 ${item.accentColor}`} />
                    {t(item.key)}
                  </Badge>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ Below-the-fold: lazy-loaded ═══════════════════ */}
        <HowItWorksSection />
        <WorkflowSection />
        <DifferentiatorsSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
