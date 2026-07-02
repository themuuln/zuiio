"use client";

import { ArrowRight, Check, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

const VALUES = [
  { key: "value1", icon: "🎯" },
  { key: "value2", icon: "👁️" },
  { key: "value3", icon: "🔒" },
  { key: "value4", icon: "📈" },
];

export default function AboutPage() {
  const t = useTranslations("about");
  const appT = useTranslations("app");
  const _authT = useTranslations("auth");

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
        <section className="px-4 py-16 sm:px-6 sm:py-24">
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
        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
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
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/10 to-background" />
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
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("approachTitle")}
            </Typography.H2>
            <div className="mt-6 space-y-3">
              {t("approachBody1")
                .split("\n")
                .filter(Boolean)
                .map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    <span className="text-muted-foreground">
                      {item.replace(/^•\s*/, "")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>
        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <Typography.H2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("valuesTitle")}
            </Typography.H2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <Card key={v.key} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                      {v.icon}
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
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("techTitle")}
            </Typography.H2>
            <Typography.Muted className="mt-6 text-muted-foreground leading-relaxed">
              {t("techBody")}
            </Typography.Muted>
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
