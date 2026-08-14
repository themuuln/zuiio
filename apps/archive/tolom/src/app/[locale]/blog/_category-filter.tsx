"use client";

import { ArrowRight, Calendar, Clock } from "lucide-react";
import { useState } from "react";

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

interface Category {
  id: string;
  label: string;
}

interface Article {
  id: number;
  category: string;
  title: string;
  desc: string;
  date: string;
  minRead: string;
}

interface CategoryFilterProps {
  categories: Category[];
  articles: Article[];
  categoriesLabel: string;
  latestTitle: string;
  noArticlesLabel: string;
  readMoreLabel: string;
}

export function CategoryFilter({
  categories,
  articles,
  categoriesLabel,
  latestTitle,
  noArticlesLabel,
  readMoreLabel,
}: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredArticles = articles.filter((a) => {
    if (activeCategory === "all") return true;
    const activeLabel =
      categories.find((c) => c.id === activeCategory)?.label ?? "";
    return a.category.toLowerCase() === activeLabel.toLowerCase();
  });

  return (
    <>
      <section className="px-4 pt-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Typography.Muted className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {categoriesLabel}
          </Typography.Muted>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
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
            {latestTitle}
          </Typography.H2>

          {filteredArticles.length === 0 && (
            <div className="rounded-lg border bg-muted/20 px-6 py-12 text-center">
              <Typography.Muted className="text-sm text-muted-foreground">
                {noArticlesLabel}
              </Typography.Muted>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="flex flex-col">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    {article.category}
                  </Badge>
                  <CardTitle className="text-sm leading-snug">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-xs leading-relaxed">
                    {article.desc}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex-col items-start gap-3 border-t pt-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {article.minRead}
                    </span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-xs">
                    {readMoreLabel}
                    <ArrowRight className="ml-1 size-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
