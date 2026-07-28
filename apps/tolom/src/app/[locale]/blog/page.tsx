import { ArrowRight, BookOpen, Calendar, Clock, Wrench } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { CategoryFilter } from "./_category-filter";

const ARTICLES = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: n,
  categoryKey: `article${n}Category`,
}));

const CATEGORIES = ["all", "updates", "guides", "tips", "industry"] as const;

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <BlogContent locale={locale} />;
}

async function BlogContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "blog",
  })) as (key: string, values?: Record<string, string | number>) => string;
  const appT = (await getTranslations({
    locale: locale as "mn" | "en",
    namespace: "app",
  })) as (key: string, values?: Record<string, string | number>) => string;

  const categories = CATEGORIES.map((cat) => ({
    id: cat,
    label: t(`category${cat.charAt(0).toUpperCase()}${cat.slice(1)}`),
  }));

  const articles = ARTICLES.map((a) => ({
    id: a.id,
    category: t(a.categoryKey),
    title: t(`article${a.id}Title`),
    desc: t(`article${a.id}Desc`),
    date: t(`article${a.id}Date`),
    minRead: t(`article${a.id}MinRead`),
  }));

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

        <CategoryFilter
          categories={categories}
          articles={articles}
          categoriesLabel={t("categories")}
          latestTitle={t("latestTitle")}
          noArticlesLabel={t("noArticles")}
          readMoreLabel={t("readMore")}
        />
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
