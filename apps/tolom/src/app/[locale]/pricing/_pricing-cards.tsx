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
import { Typography } from "@/components/ui/typography";
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
    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
  ) : (
    <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
  );
}

export function PricingCards({ plans, translations }: PricingCardsProps) {
  const [annual, setAnnual] = useState(true);
  const gridPlans = plans.filter((p) => p.key !== "enterprise");
  const enterprisePlan = plans.find((p) => p.key === "enterprise");

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-2">
        <span className={cn("text-sm", !annual && "font-semibold")}>
          {translations.monthly}
        </span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className={cn("text-sm", annual && "font-semibold")}>
          {translations.annual}
        </span>
        {annual && (
          <Badge variant="secondary" className="text-xs">
            {translations.annualSave}
          </Badge>
        )}
      </div>

      {/* Card Grid: Business | Complete ★ | Core */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:gap-6 lg:grid-cols-3">
        {gridPlans.map((plan) => {
          const isCore = plan.key === "core";
          const price = annual
            ? `${plan.annualPrice}${translations.perYear}`
            : `${plan.monthlyPrice}${translations.perMonth}`;
          const perUnit =
            annual && plan.annualPerMonth
              ? `${plan.annualPerMonth}${translations.perMonth}`
              : null;

          return (
            <Card
              key={plan.key}
              size="sm"
              className={cn(
                "relative flex flex-col transition-all duration-300",
                plan.popular
                  ? "overflow-visible ring-2 ring-primary shadow-md"
                  : "",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="pointer-events-none whitespace-nowrap bg-primary text-primary-foreground">
                    <Star className="mr-1 size-3" />
                    {translations.mostPopular}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-lg">
                  {translations[`${plan.key}Name`]}
                </CardTitle>
                <CardDescription>
                  {translations[`${plan.key}Desc`]}
                </CardDescription>

                <div className="mt-4">
                  <span
                    key={price}
                    className="text-3xl font-semibold tracking-tight transition-all duration-200"
                  >
                    {price}
                  </span>
                  {perUnit && (
                    <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                      ~{perUnit} — {translations.annualSave}
                    </Typography.Muted>
                  )}
                  {!perUnit && plan.key === "complete" && !annual && (
                    <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                      {translations.startTrial}
                    </Typography.Muted>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f.key} className="flex items-start gap-2 text-sm">
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

              <CardFooter className="flex-col gap-2">
                <Button
                  variant={plan.ctaVariant}
                  className="w-full"
                  render={<Link href="/auth/signup" />}
                >
                  {isCore ? translations.getStarted : translations.startTrial}
                  <ArrowRight className="ml-1 size-4" />
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
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
          <div className="relative isolate overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-r from-muted/30 via-background to-muted/30 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold">
                  {translations.enterpriseName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {translations.enterpriseDesc}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {enterprisePlan.features.slice(0, 4).map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <Check className="size-3 text-emerald-500" />
                      {translations[f.key]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center sm:text-right shrink-0">
                <div className="text-2xl font-semibold">
                  {translations.customPrice}
                </div>
                <Button
                  variant="outline"
                  className="mt-2"
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
