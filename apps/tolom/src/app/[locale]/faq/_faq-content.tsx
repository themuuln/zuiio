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

  return (
    <>
      <div className="relative mx-auto mt-8 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchQuery ? "" : "Асуултаа бичнэ үү..."}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {categories.map((category) => {
            const filtered = category.questions.filter((item) => {
              if (!searchQuery) return true;
              const qText = t(item.q).toLowerCase();
              const aText = t(item.a).toLowerCase();
              const q = searchQuery.toLowerCase();
              return qText.includes(q) || aText.includes(q);
            });

            if (filtered.length === 0) return null;

            return (
              <div key={category.key} className="mb-10">
                <div className="mb-4">
                  <Typography.H2 className="text-lg font-semibold">
                    {t(`cat${category.key}`)}
                  </Typography.H2>
                  <Typography.Muted className="text-sm text-muted-foreground">
                    {t(`cat${category.key}Desc`)}
                  </Typography.Muted>
                </div>

                <Accordion className="w-full">
                  {filtered.map((item) => (
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

          {searchQuery && (
            <div className="py-12 text-center">
              <Typography.Muted className="text-muted-foreground">
                Хайлтын үр дүн олдсонгүй. Өөр түлхүүр үгээр дахин хайна уу.
              </Typography.Muted>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
