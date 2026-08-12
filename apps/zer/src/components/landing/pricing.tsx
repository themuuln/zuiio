"use client";

import { Check, Minus } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// NOTE: Prices shown are illustrative. Payment integration (card/gateway) is
// required before this section can be used for live subscriptions.

type Plan = {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Үнэгүй",
    monthlyPrice: "₮0",
    yearlyPrice: "₮0",
    description: "Ганц эзэмшигчид тохиромжтой",
  },
  {
    name: "Стандарт",
    monthlyPrice: "₮79,000",
    yearlyPrice: "₮790,000",
    description: "Нэг салбарт бүрэн хяналт",
    highlighted: true,
  },
  {
    name: "Бизнес",
    monthlyPrice: "₮129,000",
    yearlyPrice: "₮1,290,000",
    description: "Олон салбар, бүрэн хяналт",
  },
  {
    name: "Аж ахуйн",
    monthlyPrice: "Тохиролцсон",
    yearlyPrice: "₮8 сая/жил",
    description: "Томоохон байгууллага, групп компаниудад",
  },
];

/** Comparison cell: `true` renders a check, `false` a dash, a string its text. */
type Cell = boolean | string;

type ComparisonGroup = {
  title: string;
  rows: Array<{ label: string; cells: Cell[] }>;
};

const comparisonGroups: ComparisonGroup[] = [
  {
    title: "Бараа ба борлуулалт",
    rows: [
      {
        label: "Барааны тоо",
        cells: ["200", "5,000", "Хязгааргүй", "Хязгааргүй"],
      },
      { label: "Борлуулалт ба POS касс", cells: [true, true, true, true] },
      { label: "Зарлагын бүртгэл", cells: [true, true, true, true] },
      { label: "Хямдрал ба урамшуулал", cells: [false, true, true, true] },
      { label: "Бэлгийн сонголт", cells: [false, true, true, true] },
      { label: "Олон агуулах", cells: [false, true, true, true] },
    ],
  },
  {
    title: "Харилцагч ба онлайн дэлгүүр",
    rows: [
      { label: "Харилцагчийн бүртгэл", cells: [true, true, true, true] },
      { label: "Онлайн дэлгүүр", cells: [false, true, true, true] },
      { label: "Хүргэлтийн удирдлага", cells: [false, true, true, true] },
      { label: "Лояльти программ", cells: [false, true, true, true] },
      { label: "Баримт бичиг", cells: [false, true, true, true] },
    ],
  },
  {
    title: "Тайлан ба дэмжлэг",
    rows: [
      { label: "Үндсэн тайлан", cells: [true, true, true, true] },
      { label: "Бүх төрлийн тайлан", cells: [false, true, true, true] },
      { label: "И-мэйл дэмжлэг", cells: [true, true, true, true] },
      { label: "Тэргүүлэх дэмжлэг", cells: [false, true, true, true] },
      { label: "24/7 дэмжлэг", cells: [false, false, true, true] },
      { label: "Dedicated support SLA", cells: [false, false, false, true] },
    ],
  },
  {
    title: "AI боломжууд",
    rows: [
      { label: "AI Telegram туслах", cells: [false, true, true, true] },
      {
        label: "AI постер ба зураг сайжруулах",
        cells: [false, true, true, true],
      },
      { label: "AI лого, нэр, тайлбар", cells: [false, true, true, true] },
      {
        label: "AI Чатбот (Facebook Messenger)",
        cells: [false, true, true, true],
      },
      { label: "Автомат өдрийн тайлан", cells: [false, true, true, true] },
    ],
  },
  {
    title: "Нягтлан ба үйлдвэрлэл",
    rows: [
      { label: "Нягтлан бодох бүртгэл", cells: [false, false, true, true] },
      {
        label: "Үйлдвэрлэлийн удирдлага (BOM)",
        cells: [false, false, true, true],
      },
      { label: "Хүний нөөц ба цалин", cells: [false, false, true, true] },
      { label: "API холболт", cells: [false, false, true, true] },
      { label: "Олон салбар", cells: [false, false, true, true] },
    ],
  },
  {
    title: "Аж ахуйн түвшин",
    rows: [
      { label: "Тохиролцсон хязгаар", cells: [false, false, false, true] },
      { label: "Тусгай интеграц", cells: [false, false, false, true] },
      { label: "Тусгай сервер", cells: [false, false, false, true] },
    ],
  },
];

function planPrice(plan: Plan, isYearly: boolean) {
  return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
}

function planCta(plan: Plan) {
  if (plan.name === "Аж ахуйн") return { href: "/contact", label: "Холбогдох" };
  if (plan.monthlyPrice === "₮0")
    return { href: "/login", label: "Үнэгүй эхлэх" };
  if (plan.highlighted)
    return { href: "/register?trial=standard", label: "14 өдөр үнэгүй турших" };
  return { href: "/register?trial=standard", label: "Эхлэх" };
}

function CellValue({ value }: { value: Cell }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check weight="bold" className="mx-auto size-4 text-primary" />
    ) : (
      <Minus
        weight="bold"
        className="mx-auto size-4 text-muted-foreground/40"
      />
    );
  }
  return <span className="text-sm">{value}</span>;
}

const GRID_COLS = "grid grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

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
          <h2 className="mb-4 font-display text-4xl leading-tight text-balance md:text-5xl">
            Энгийн үнэ тогтолцоо
          </h2>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
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
                2 сар үнэгүй
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const cta = planCta(plan);
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6",
                  plan.highlighted
                    ? "border-primary/30 shadow-xl ring-1 ring-primary/10"
                    : "border-border/60 shadow-sm",
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Хамгийн сонголт
                  </Badge>
                )}
                <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">
                    {planPrice(plan, isYearly)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.name === "Аж ахуйн" ? "" : isYearly ? "/жил" : "/сар"}
                  </span>
                </div>
                <div className="mt-auto">
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                    className="w-full"
                  >
                    <Link href={cta.href}>{cta.label}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features comparison table */}
        <div className="mt-16">
          <div className="mb-6 text-center">
            <h3 className="font-display text-2xl text-balance md:text-3xl">
              Багцын мэдээлэл
            </h3>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Багцуудын дэлгэрэнгүй боломжуудыг доороос харна уу.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="min-w-[720px]">
              {/* Plan header row */}
              <div
                className={cn(
                  GRID_COLS,
                  "border-b border-border/60 bg-muted/50",
                )}
              >
                <div className="px-4 py-3" />
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "flex flex-col gap-1 px-4 py-4",
                      plan.highlighted && "bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      {plan.highlighted && (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Хамгийн сонголт
                        </Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                      {planPrice(plan, isYearly)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {plan.name === "Аж ахуйн"
                        ? "Тохиролцсон"
                        : isYearly
                          ? "/жил"
                          : "/сар"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grouped feature rows */}
              {comparisonGroups.map((group) => (
                <div key={group.title}>
                  <div
                    className={cn(
                      GRID_COLS,
                      "border-b border-border/60 bg-muted/30",
                    )}
                  >
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </div>
                    <div className="col-span-4" />
                  </div>
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className={cn(
                        GRID_COLS,
                        "border-b border-border/40 last:border-0",
                      )}
                    >
                      <div className="sticky left-0 z-10 border-r border-border/40 bg-card px-4 py-3">
                        <span className="text-sm font-medium">{row.label}</span>
                      </div>
                      {row.cells.map((cell, i) => (
                        <div
                          key={plans[i]?.name ?? i}
                          className={cn(
                            "flex items-center justify-center px-2 py-3",
                            plans[i]?.highlighted && "bg-primary/[0.04]",
                          )}
                        >
                          <CellValue value={cell} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
