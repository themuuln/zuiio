import {
  ArrowRight,
  Check,
  Eye,
  Shield,
  Target,
  TrendingUp,
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
import { Typography } from "@/components/ui/typography";
import { LandingFooter } from "../_landing-footer";

const VALUES = [
  { key: "value1", Icon: Target },
  { key: "value2", Icon: Eye },
  { key: "value3", Icon: Shield },
  { key: "value4", Icon: TrendingUp },
] as const;

const APPROACH_BULLETS = [
  "approachBullet1",
  "approachBullet2",
  "approachBullet3",
  "approachBullet4",
  "approachBullet5",
] as const;

const SECTIONS = [
  { id: "story", key: "storyTitle" },
  { id: "mission", key: "missionTitle" },
  { id: "approach", key: "approachTitle" },
  { id: "values", key: "valuesTitle" },
  { id: "tech", key: "techTitle" },
  { id: "cta", key: "ctaTitle" },
] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AboutContent locale={locale} />;
}

async function AboutContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "about",
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
              TOLOM
            </Badge>
            <Typography.H1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pageTitle")}
            </Typography.H1>
            <Typography.Muted className="mt-3 text-base text-muted-foreground sm:text-lg">
              {t("pageDescription")}
            </Typography.Muted>
          </div>
        </section>

        <nav className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur-xs">
          <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-4 py-2 sm:justify-center sm:px-6">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm"
              >
                {t(s.key)}
              </a>
            ))}
          </div>
        </nav>

        <section
          id="story"
          className="scroll-mt-[112px] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("storyTitle")}
            </Typography.H2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <Typography.Text>{t("storyBody1")}</Typography.Text>
              <Typography.Text>{t("storyBody2")}</Typography.Text>
            </div>
          </div>
        </section>
        <section
          id="mission"
          className="scroll-mt-[112px] border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-background" />
              <CardHeader>
                <Badge className="mb-2 w-fit" variant="secondary">
                  🚀
                </Badge>
                <CardTitle className="text-xl">{t("missionTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography.Muted className="text-muted-foreground leading-relaxed">
                  {t("missionBody")}
                </Typography.Muted>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/10 to-background" />
              <CardHeader>
                <Badge className="mb-2 w-fit" variant="secondary">
                  🔭
                </Badge>
                <CardTitle className="text-xl">{t("visionTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography.Muted className="text-muted-foreground leading-relaxed">
                  {t("visionBody")}
                </Typography.Muted>
              </CardContent>
            </Card>
          </div>
        </section>
        <section
          id="approach"
          className="scroll-mt-[112px] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("approachTitle")}
            </Typography.H2>
            <div className="mt-6 space-y-3">
              {APPROACH_BULLETS.map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="values"
          className="scroll-mt-[112px] border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <Typography.H2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("valuesTitle")}
            </Typography.H2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <Card key={v.key} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <v.Icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="mt-3 text-base">
                      {t(`${v.key}`)}
                    </CardTitle>
                    <CardDescription>{t(`${v.key}Desc`)}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section
          id="tech"
          className="scroll-mt-[112px] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("techTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-6 text-muted-foreground leading-relaxed">
              {t("techBody")}
            </Typography.Muted>
          </div>
        </section>
        <section
          id="cta"
          className="scroll-mt-[112px] border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24"
        >
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

      <LandingFooter />
    </div>
  );
}
