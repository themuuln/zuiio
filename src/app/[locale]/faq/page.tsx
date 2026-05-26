"use client";

import { ArrowRight, HelpCircle, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LandingNav } from "@/components/landing-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES: {
  key: string;
  questions: { q: string; a: string }[];
}[] = [
  {
    key: "General",
    questions: [
      { q: "q1", a: "a1" },
      { q: "q2", a: "a2" },
      { q: "q3", a: "a3" },
      { q: "q4", a: "a4" },
      { q: "q5", a: "a5" },
    ],
  },
  {
    key: "WorkOrders",
    questions: [
      { q: "q6", a: "a6" },
      { q: "q7", a: "a7" },
      { q: "q8", a: "a8" },
    ],
  },
  {
    key: "Customers",
    questions: [
      { q: "q9", a: "a9" },
      { q: "q10", a: "a10" },
      { q: "q11", a: "a11" },
      { q: "q12", a: "a12" },
    ],
  },
  {
    key: "Inventory",
    questions: [
      { q: "q13", a: "a13" },
      { q: "q14", a: "a14" },
      { q: "q15", a: "a15" },
    ],
  },
  {
    key: "Finance",
    questions: [
      { q: "q16", a: "a16" },
      { q: "q17", a: "a17" },
      { q: "q18", a: "a18" },
      { q: "q19", a: "a19" },
    ],
  },
  {
    key: "Reminders",
    questions: [
      { q: "q20", a: "a20" },
      { q: "q21", a: "a21" },
    ],
  },
  {
    key: "Settings",
    questions: [
      { q: "q22", a: "a22" },
      { q: "q23", a: "a23" },
      { q: "q24", a: "a24" },
      { q: "q25", a: "a25" },
    ],
  },
  {
    key: "Account",
    questions: [
      { q: "q26", a: "a26" },
      { q: "q27", a: "a27" },
      { q: "q28", a: "a28" },
    ],
  },
];

export default function FaqPage() {
  const t = useTranslations("faq");
  const appT = useTranslations("app");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <HelpCircle className="mr-1 size-3" />
              FAQ
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              {t("pageDescription")}
            </p>
            <div className="relative mx-auto mt-8 max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchQuery ? "" : "Асуултаа бичнэ үү..."}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            {CATEGORIES.map((category) => {
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
                    <h2 className="text-lg font-semibold">
                      {t(`cat${category.key}`)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t(`cat${category.key}Desc`)}
                    </p>
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
                          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                            {t(item.a)}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}

            {searchQuery && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  Хайлтын үр дүн олдсонгүй. Өөр түлхүүр үгээр дахин хайна уу.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Өөр асуулт байна уу?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Хариултаа олоогүй бол бидэнтэй холбогдоорой. Бид туслахад баяртай
              байх болно.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
              >
                TOLOM-г үнэгүй турших
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/auth/login" />}
                nativeButton={false}
              >
                Нэвтрэх
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
          <p className="mt-2">{appT("tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
