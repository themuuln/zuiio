"use client";

import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Үнэгүй",
    monthlyPrice: "₮0",
    yearlyPrice: "₮0",
    description: "Жижиг бизнес эхлэхэд тохиромжтой",
    features: [
      "50 хүртэлх бараа",
      "Борлуулалтын бүртгэл",
      "Зарлагын бүртгэл",
      "Үндсэн тайлан",
      "Имэйл дэмжлэг",
    ],
    highlighted: false,
  },
  {
    name: "Стандарт",
    monthlyPrice: "₮49,000",
    yearlyPrice: "₮39,000",
    description: "Өсөн нэмэгдэж буй бизнест тохиромжтой",
    features: [
      "500 хүртэлх бараа",
      "Бүх төрлийн тайлан",
      "Online дэлгүүр",
      "Харилцагчийн менежмент",
      "Тэргүүлэх дэмжлэг",
    ],
    highlighted: true,
  },
  {
    name: "Аж ахуйн",
    monthlyPrice: "₮99,000",
    yearlyPrice: "₮79,000",
    description: "Томоохон байгууллагад тохиромжтой",
    features: [
      "Барааны тоо хязгааргүй",
      "Бүрэн боломж",
      "Олон хэрэглэгч",
      "API холболт",
      "24/7 дэмжлэг",
    ],
    highlighted: false,
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Энгийн үнэ тогтолцоо
          </h2>
          <p className="mb-8 text-muted-foreground">
            Бизнесийн хэмжээнд тохирсон төлөвлөгөө. Хүссэн үедээ шинэчлэх эсвэл
            цуцлах боломжтой.
          </p>

          <div className="inline-flex items-center gap-3 rounded-full border bg-muted p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                !isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Сарын
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Жилийн
              <span className="ml-1.5 text-xs text-emerald-600">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-primary/30 bg-primary/5 shadow-lg"
                  : "bg-background"
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Хамгийн сонголт
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="mb-1 font-semibold text-lg">{plan.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mb-1">
                  <span className="text-3xl font-bold">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    /сар
                  </span>
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      weight="bold"
                      className="size-4 text-emerald-500 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                asChild
                className="w-full"
              >
                <Link href="/login">Эхлэх</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
