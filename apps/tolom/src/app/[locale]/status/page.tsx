import {
  ArrowRight,
  CheckCircle,
  Database,
  Folder,
  KeyRound,
  Mail,
  Monitor,
  PlugZap,
  Smartphone,
  Zap,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import { LandingFooter } from "../_landing-footer";
import { StatusSubscribeForm } from "./_status-subscribe-form";

const SERVICES = [
  { key: "Platform", icon: Monitor },
  { key: "Api", icon: PlugZap },
  { key: "Database", icon: Database },
  { key: "Auth", icon: KeyRound },
  { key: "Storage", icon: Folder },
  { key: "Email", icon: Mail },
  { key: "Messaging", icon: Smartphone },
  { key: "Edge", icon: Zap },
] as const;

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <StatusContent locale={locale} />;
}

async function StatusContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("hourly");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "status",
  })) as (key: string, values?: Record<string, string | number>) => string;
  const _authT = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "auth",
  })) as (key: string, values?: Record<string, string | number>) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <CheckCircle className="mr-1 size-3 text-emerald-500" />
              {t("statusOperational")}
            </Badge>
            <Typography.H1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pageTitle")}
            </Typography.H1>
            <Typography.Muted className="mt-3 text-base text-muted-foreground sm:text-lg">
              {t("pageDescription")}
            </Typography.Muted>
          </div>
        </section>
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {SERVICES.map((svc) => (
                <Card key={svc.key}>
                  <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svc.icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {t(`service${svc.key}`)}
                      </CardTitle>
                      <Typography.Muted className="text-xs text-muted-foreground">
                        {t(`service${svc.key}Desc`)}
                      </Typography.Muted>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                      <CheckCircle className="mr-1 size-3" />
                      {t("statusOperational")}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══ Uptime ───────────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-lg font-semibold">
              {t("uptimeTitle")}
            </Typography.H2>
            <div className="mt-4 flex gap-6">
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <div className="text-2xl font-bold text-emerald-500">99.9%</div>
                <div className="text-xs text-muted-foreground">
                  {t("uptimeLast30")}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <div className="text-2xl font-bold text-emerald-500">99.8%</div>
                <div className="text-xs text-muted-foreground">
                  {t("uptimeAllTime")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-lg font-semibold">
              {t("incidentTitle")}
            </Typography.H2>
            <div className="mt-4 rounded-lg border bg-muted/20 px-6 py-8 text-center">
              <Typography.Muted className="text-sm text-muted-foreground">
                {t("incidentNone")}
              </Typography.Muted>
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══ Subscribe ────────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-md text-center">
            <Typography.H2 className="text-lg font-semibold">
              {t("subscribeTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-2 text-sm text-muted-foreground">
              {t("subscribeDesc")}
            </Typography.Muted>
            <StatusSubscribeForm />
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
