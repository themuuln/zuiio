"use client";

import { Check } from "@phosphor-icons/react";
// NOTE: Prices shown are illustrative. Payment integration (card/gateway) is
// required before this section can be used for live subscriptions.

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Үнэгүй",
    monthlyPrice: "₮0",
    yearlyPrice: "₮0",
    description: "Жижиг бизнес эхлэхэд тохиромжтой",
    features: [
      "200 хүртэлх бараа",
      "Борлуулалт ба POS касс",
      "Зарлагын бүртгэл",
      "Үндсэн тайлан",
      "Харилцагчийн бүртгэл",
      "Имэйл дэмжлэг",
    ],
    highlighted: false,
    icon: true,
  },
  {
    name: "Стандарт",
    monthlyPrice: "₮49,000",
    yearlyPrice: "₮39,000",
    description: "Өсөн нэмэгдэж буй бизнест тохиромжтой",
    features: [
      "5,000 хүртэлх бараа",
      "Бүх төрлийн тайлан",
      "Онлайн дэлгүүр",
      "AI Telegram туслах",
      "Автомат өдрийн тайлан",
      "Олон агуулах",
      "Худалдан авалт ба нийлүүлэгч",
      "Тэргүүлэх дэмжлэг",
    ],
    highlighted: true,
    icon: false,
  },
  {
    name: "Аж ахуйн",
    monthlyPrice: "₮99,000",
    yearlyPrice: "₮79,000",
    description: "Томоохон байгууллагад тохиромжтой",
    features: [
      "Барааны тоо хязгааргүй",
      "Бүрэн боломж — бүх модуль",
      "Нягтлан бодох бүртгэл",
      "Үйлдвэрлэлийн удирдлага (BOM)",
      "Хүний нөөц ба цалин",
      "Олон салбар",
      "API холболт",
      "24/7 тэргүүлэх дэмжлэг",
    ],
    highlighted: false,
    icon: true,
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t py-20 md:py-28"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.02] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Үнэ тогтолцоо
          </p>
          <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
            Энгийн үнэ тогтолцоо
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Бизнесийн хэмжээнд тохирсон төлөвлөгөө. Хүссэн үедээ шинэчлэх эсвэл
            цуцлах боломжтой.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border/60 bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
                !isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Сарын
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
                isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Жилийн
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-all duration-200",
                plan.highlighted
                  ? "border-primary/30 bg-gradient-to-b from-primary/[0.04] to-card shadow-xl ring-1 ring-primary/10 scale-[1.02] lg:scale-105"
                  : "border-border/60 bg-card shadow-sm hover:shadow-md",
              )}
            >
              {plan.highlighted && (
                <>
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-primary/[0.06] to-transparent" />
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Хамгийн сонголт
                  </Badge>
                </>
              )}

              <div className="mb-8">
                <h3 className="mb-1.5 text-lg font-semibold">{plan.name}</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/сар</span>
                </div>
                {isYearly && plan.yearlyPrice !== "₮0" && (
                  <p className="mt-1 text-xs text-muted-foreground line-through">
                    {plan.monthlyPrice}/сар
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check weight="bold" className="size-3 text-primary" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                asChild
                className="w-full"
              >
                <Link href="/login">
                  {plan.monthlyPrice === "₮0" ? "Үнэгүй эхлэх" : "Эхлэх"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
