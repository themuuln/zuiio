"use client";

import { ArrowRight, Check, Star, X } from "lucide-react";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FeatureStatus = boolean | "addon";

interface PlanFeature {
  key: string;
  included: FeatureStatus;
}

interface PlanData {
  key: string;
  monthlyPrice: string;
  annualPrice: string;
  annualPerMonth: string | null;
  features: PlanFeature[];
  ctaVariant: "default" | "outline";
  popular: boolean;
}

interface PricingCardsProps {
  plans: PlanData[];
  translations: Record<string, string>;
}

function FeatureIcon({
  status,
  addonLabel,
}: {
  status: FeatureStatus;
  addonLabel: string;
}) {
  if (status === "addon") {
    return (
      <span className="mt-0.5 text-xs text-muted-foreground">{addonLabel}</span>
    );
  }
  return status ? (
    <Check
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-emerald-500"
    />
  ) : (
    <X
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
    />
  );
}

export function PricingCards({ plans, translations }: PricingCardsProps) {
  const [annual, setAnnual] = useState(true);
  const gridPlans = plans.filter((p) => p.key !== "enterprise");
  const enterprisePlan = plans.find((p) => p.key === "enterprise");

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-base transition-colors",
            !annual ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {translations.monthly}
        </span>
        <Switch
          checked={annual}
          onCheckedChange={setAnnual}
          aria-label={translations.toggleLabel}
        />
        <span
          className={cn(
            "text-base transition-colors",
            annual ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {translations.annual}
        </span>
        {annual && (
          <Badge variant="secondary" className="whitespace-nowrap text-xs">
            {translations.annualSave}
          </Badge>
        )}
      </div>

      {/* Card Grid: Core | Complete ★ | Business */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:gap-6 lg:grid-cols-3">
        {gridPlans.map((plan) => {
          const isCore = plan.key === "core";
          const priceValue =
            annual && plan.annualPerMonth
              ? plan.annualPerMonth
              : plan.monthlyPrice;

          return (
            <Card
              key={plan.key}
              className={cn(
                "relative flex flex-col transition-all duration-300",
                plan.popular
                  ? "overflow-visible ring-2 ring-primary hover:-translate-y-1 hover:ring-primary"
                  : "hover:-translate-y-1 hover:ring-2 hover:ring-foreground/10",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge className="pointer-events-none whitespace-nowrap bg-primary text-primary-foreground">
                    <Star aria-hidden="true" className="mr-1 size-3.5" />
                    {translations.mostPopular}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {translations[`${plan.key}Name`]}
                </CardTitle>
                <CardDescription className="text-[15px]">
                  {translations[`${plan.key}Desc`]}
                </CardDescription>

                <div className="mt-5">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      key={priceValue}
                      className="text-[2.5rem] leading-none font-bold tracking-tight tabular-nums transition-all duration-200"
                    >
                      {priceValue}
                    </span>
                    <span className="text-base text-muted-foreground">
                      {translations.perMonth}
                    </span>
                  </div>
                  {annual && plan.annualPerMonth && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {translations.billedAnnually} · {plan.annualPrice}
                      {translations.perYear}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li
                      key={f.key}
                      className="flex items-start gap-2.5 text-[15px] leading-snug"
                    >
                      <FeatureIcon
                        status={f.included}
                        addonLabel={translations.valueAddon}
                      />
                      <span
                        className={
                          f.included ? "" : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {translations[f.key]}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex-col gap-2.5">
                <Button
                  variant={plan.ctaVariant}
                  className="w-full"
                  render={<Link href="/auth/signup" />}
                >
                  {isCore ? translations.getStarted : translations.startTrial}
                  <ArrowRight className="ml-1 size-4" />
                </Button>
                <p className="text-center text-[13px] text-muted-foreground">
                  {translations.trialCta}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Enterprise Strip */}
      {enterprisePlan && (
        <div className="mx-auto mt-8 max-w-5xl">
          <div className="relative isolate overflow-hidden rounded-xl border bg-gradient-to-r from-muted/30 via-background to-muted/30 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-[var(--brand-violet-glow)] blur-3xl" />
            </div>
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-semibold">
                  {translations.enterpriseName}
                </h3>
                <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                  {translations.enterpriseDesc}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2.5 sm:justify-start">
                  {enterprisePlan.features.slice(0, 4).map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                    >
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-emerald-500"
                      />
                      {translations[f.key]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-center sm:text-right">
                <div className="text-3xl font-bold tracking-tight">
                  {translations.customPrice}
                </div>
                <Button
                  variant="outline"
                  className="mt-3"
                  render={<Link href="mailto:hello@tolom.app" />}
                >
                  {translations.contactSales}
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
