import {
  ArrowRight,
  CheckCircle2,
  Clock,
  List,
  Tag,
  Wrench,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

const FEATURES = [
  { key: "PricingMemory", icon: Tag },
  { key: "Categories", icon: List },
  { key: "Intervals", icon: Clock },
  { key: "Export", icon: CheckCircle2 },
];

const SAMPLE_SERVICES = [1, 2, 3, 4, 5, 6];

const DEFAULT_INTERVALS = [1, 2, 3, 4, 5, 6];

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <ServicesContent locale={locale} />;
}

async function ServicesContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({ locale: locale as "mn" | "en", namespace: "services" })) as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const appT = (await getTranslations({ locale: locale as "mn" | "en", namespace: "app" })) as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <Wrench className="mr-1 size-3" />
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
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("introTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-4 text-muted-foreground leading-relaxed">
              {t("introBody")}
            </Typography.Muted>
          </div>
        </section>

        <Separator />

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <Card key={f.key} className="text-center">
                    <CardHeader>
                      <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <CardTitle className="mt-3 text-sm">
                        {t(`feature${f.key}`)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t(`feature${f.key}Desc`)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <Separator />

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <Typography.H2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("sampleServicesTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-3 text-center text-muted-foreground">
              {t("sampleServicesDesc")}
            </Typography.Muted>

            <div className="mt-10 overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Үйлчилгээ
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Ангилал
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Үнэ
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Интервал
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SERVICES.map((s) => (
                    <tr key={s} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {t(`sample${s}Name`)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t(`sample${s}Cat`)}
                      </td>
                      <td className="px-4 py-3">{t(`sample${s}Price`)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t(`sample${s}Interval`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("defaultIntervalsTitle")}
            </Typography.H2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {DEFAULT_INTERVALS.map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3"
                >
                  <Clock className="size-4 shrink-0 text-primary" />
                  <span className="text-sm">{t(`defaultInterval${i}`)}</span>
                </div>
              ))}
            </div>
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
                {t("ctaButton")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/pricing" />}
                nativeButton={false}
              >
                Үнийн санал
              </Button>
            </div>
          </div>
        </section>
      </main>

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
