import {
  ArrowRight,
  Cable,
  CheckCircle2,
  Clock,
  Construction,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import { LandingFooter } from "../_landing-footer";

const INTEGRATIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 size-3" />
        {status}
      </Badge>
    );
  }
  if (status === "ready") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
      >
        <Clock className="mr-1 size-3" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-muted-foreground/20 text-muted-foreground"
    >
      <Construction className="mr-1 size-3" />
      {status}
    </Badge>
  );
}

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <IntegrationsContent locale={locale} />;
}

async function IntegrationsContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "integrations",
  })) as (key: string, values?: Record<string, string | number>) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <Cable className="mr-1 size-3" />
              {t("pageTitle")}
            </Badge>
            <Typography.H1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pageTitle")}
            </Typography.H1>
            <Typography.Muted className="mt-3 text-base text-muted-foreground sm:text-lg">
              {t("pageDescription")}
            </Typography.Muted>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("ecosystemTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-3 text-muted-foreground">
              {t("ecosystemDesc")}
            </Typography.Muted>
          </div>
        </section>

        <Separator />

        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base">
                      {t(`integration${i}`)}
                    </CardTitle>
                    <StatusBadge status={t(`integration${i}Status`)} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-sm leading-relaxed">
                    {t(`integration${i}Desc`)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("ctaTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-3 text-muted-foreground">
              {t("ctaSubtitle")}
            </Typography.Muted>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
              >
                {t("ctaButtonGettingStarted")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/pricing" />}
                nativeButton={false}
              >
                {t("ctaPricing")}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
