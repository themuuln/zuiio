"use client";

import { ArrowRight, BookOpen, Calendar, Clock, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LandingNav } from "@/components/landing-nav";
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
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

const ARTICLES = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: n,
  categoryKey: `article${n}Category`,
}));

const CATEGORIES = ["all", "updates", "guides", "tips", "industry"] as const;

export default function BlogPage() {
  const t = useTranslations("blog");
  const appT = useTranslations("app");
  const _authT = useTranslations("auth");
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="mr-1 size-3" />
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
        <section className="px-4 pt-12 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-5xl">
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[2%] to-background sm:flex">
              <div className="flex-1 p-6 sm:p-8">
                <Badge className="mb-3 w-fit">{t("featuredTag")}</Badge>
                <Badge variant="secondary" className="mb-3 ml-2">
                  {t("article1Category")}
                </Badge>
                <CardTitle className="text-xl sm:text-2xl">
                  {t("article1Title")}
                </CardTitle>
                <CardDescription className="mt-3 text-sm leading-relaxed">
                  {t("article1Desc")}
                </CardDescription>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {t("article1Date")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {t("article1MinRead")}
                  </span>
                </div>
                <CardFooter className="mt-4 px-0">
                  <Button variant="link" className="h-auto p-0">
                    {t("readMore")}
                    <ArrowRight className="ml-1 size-3" />
                  </Button>
                </CardFooter>
              </div>
            </Card>
          </div>
        </section>
        <section className="px-4 pt-10 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <Typography.Muted className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("categories")}
            </Typography.Muted>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {(t as any)(`category${cat.charAt(0).toUpperCase()}${cat.slice(1)}`)}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <Separator className="mx-auto mt-8 max-w-5xl" />

        {/* ═══ Article Grid ────────────────────────────────── */}
        <section className="px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <Typography.H2 className="mb-8 text-lg font-semibold">
              {t("latestTitle")}
            </Typography.H2>

            {ARTICLES.filter((a) => {
              if (activeCategory === "all") return true;
              const catKey = t(a.categoryKey).toLowerCase();
              const filterKey = t(
                `category${activeCategory.charAt(0).toUpperCase()}${activeCategory.slice(1)}`,
              ).toLowerCase();
              return catKey === filterKey;
            }).length === 0 && (
              <div className="rounded-lg border bg-muted/20 px-6 py-12 text-center">
                <Typography.Muted className="text-sm text-muted-foreground">
                  {t("noArticles")}
                </Typography.Muted>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ARTICLES.filter((a) => {
                if (activeCategory === "all") return true;
                const catKey = t(a.categoryKey).toLowerCase();
                const filterKey = t(
                  `category${activeCategory.charAt(0).toUpperCase()}${activeCategory.slice(1)}`,
                ).toLowerCase();
                return catKey === filterKey;
              }).map((article) => (
                <Card key={article.id} className="flex flex-col">
                  <CardHeader>
                    <Badge variant="secondary" className="mb-2 w-fit">
                      {(t as any)(`article${article.id}Category`)}
                    </Badge>
                    <CardTitle className="text-sm leading-snug">
                      {(t as any)(`article${article.id}Title`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription className="text-xs leading-relaxed">
                      {(t as any)(`article${article.id}Desc`)}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-3 border-t pt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {(t as any)(`article${article.id}Date`)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {(t as any)(`article${article.id}MinRead`)}
                      </span>
                    </div>
                    <Button variant="link" className="h-auto p-0 text-xs">
                      {t("readMore")}
                      <ArrowRight className="ml-1 size-3" />
                    </Button>
                  </CardFooter>
                </Card>
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
