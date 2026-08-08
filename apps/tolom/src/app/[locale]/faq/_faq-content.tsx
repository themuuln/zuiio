"use client";

import { HelpCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

interface Category {
  key: string;
  questions: { q: string; a: string }[];
}

export function FaqContent({ categories }: { categories: Category[] }) {
  const t = useTranslations("faq") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      filtered: category.questions.filter((item) => {
        if (!query) return true;
        const qText = t(item.q).toLowerCase();
        const aText = t(item.a).toLowerCase();
        return qText.includes(query) || aText.includes(query);
      }),
    }))
    .filter((category) => category.filtered.length > 0);

  return (
    <>
      <div className="relative mx-auto mt-8 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {filteredCategories.map((category) => {
            const catKey = `cat${category.key.charAt(0).toUpperCase()}${category.key.slice(1)}`;
            return (
              <div key={category.key} className="mb-10">
                <div className="mb-4">
                  <Typography.H2 className="text-lg font-semibold">
                    {t(catKey)}
                  </Typography.H2>
                  <Typography.Muted className="text-sm text-muted-foreground">
                    {t(`${catKey}Desc`)}
                  </Typography.Muted>
                </div>

                <Accordion className="w-full">
                  {category.filtered.map((item) => (
                    <AccordionItem
                      key={item.q}
                      value={`${category.key}-${item.q}`}
                    >
                      <AccordionTrigger className="text-left text-sm font-medium">
                        <span className="flex items-start gap-2">
                          <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          {t(item.q)}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Typography.Muted className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {t(item.a)}
                        </Typography.Muted>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}

          {query && filteredCategories.length === 0 && (
            <div className="py-12 text-center">
              <Typography.Muted className="text-muted-foreground">
                {t("noResults")}
              </Typography.Muted>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
