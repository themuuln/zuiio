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
  text: string;
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

function FeatureIcon({ status }: { status: FeatureStatus }) {
  if (status === "addon") {
    return <span className="mt-0.5 text-xs text-muted-foreground">Add-on</span>;
  }
  return status ? (
    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
  ) : (
    <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
  );
}

export function PricingCards({ plans, translations }: PricingCardsProps) {
  const [annual, setAnnual] = useState(false);

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
        <Badge variant="outline" className="text-xs">
          {translations.savePercent}
        </Badge>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl gap-4 sm:gap-6 lg:grid-cols-4">
        {plans.map((plan) => {
          const isStarter = plan.key === "starter";
          const isEnterprise = plan.key === "enterprise";
          const price = annual
            ? `${plan.annualPrice}/жил`
            : `${plan.monthlyPrice}/сар`;
          const perUnit =
            annual && plan.annualPerMonth ? `${plan.annualPerMonth}/сар` : null;

          return (
            <Card
              key={plan.key}
              size="sm"
              className={cn(
                "relative flex flex-col transition-all duration-300",
                plan.popular
                  ? "overflow-visible ring-2 ring-primary shadow-md"
                  : isEnterprise
                    ? "border-dashed border-muted-foreground/30"
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
                      {perUnit} {translations.monthly.toLowerCase()}
                    </Typography.Muted>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      <FeatureIcon status={f.included} />
                      <span
                        className={
                          f.included ? "" : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex-col gap-2">
                <Button
                  variant={plan.ctaVariant}
                  className="w-full"
                  render={
                    <Link href={isEnterprise ? "/contact" : "/auth/signup"} />
                  }
                >
                  {isEnterprise
                    ? translations.contactSales
                    : translations[isStarter ? "getStarted" : "startTrial"]}
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
