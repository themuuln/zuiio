"use client";

import { ArrowRight, CheckCircle, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

const SERVICES = [
  { key: "Platform", icon: "🖥️" },
  { key: "Api", icon: "🔌" },
  { key: "Database", icon: "🗄️" },
  { key: "Auth", icon: "🔑" },
  { key: "Storage", icon: "📁" },
  { key: "Email", icon: "✉️" },
  { key: "Sms", icon: "📱" },
  { key: "Edge", icon: "⚡" },
];

export default function StatusPage() {
  const t = useTranslations("status") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const appT = useTranslations("app") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const _authT = useTranslations("auth") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
                    <span className="text-xl">{svc.icon}</span>
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
            {subscribed ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="size-4" />
                {t("subscribed")}
              </div>
            ) : (
              <form
                className="mt-6 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
              >
                <Input
                  type="email"
                  placeholder={t("subscribePlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  {t("subscribeButton")}
                </Button>
              </form>
            )}
          </div>
        </section>
        <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              TOLOM-г туршиж үзэх
            </Typography.H2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
              >
                Үнэгүй эхлэх
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
