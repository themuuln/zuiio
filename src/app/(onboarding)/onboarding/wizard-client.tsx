"use client";

import {
  ArrowRight,
  Check,
  CheckCircle,
  Cube,
  SealCheck,
  Spinner,
  Storefront,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

interface Preset {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  product_name: string;
}

interface BrandGroup {
  brandName: string;
  logoUrl: string | null;
  count: number;
}

function groupByBrand(presets: Preset[]): BrandGroup[] {
  const map = new Map<string, { logoUrl: string | null; count: number }>();
  for (const p of presets) {
    const existing = map.get(p.brand_name) ?? {
      logoUrl: p.brand_logo_url,
      count: 0,
    };
    existing.count++;
    map.set(p.brand_name, existing);
  }
  return Array.from(map.entries()).map(([brandName, info]) => ({
    brandName,
    logoUrl: info.logoUrl,
    count: info.count,
  }));
}

type Step = "presets" | "features" | "complete";

interface OnboardingWizardProps {
  presets: Preset[];
  importedBrandNames: string[];
  companyType: string;
}

export function OnboardingWizard({
  presets,
  importedBrandNames,
  companyType,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("presets");
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [skipPresets, setSkipPresets] = useState(false);

  const brands = useMemo(
    () =>
      groupByBrand(presets).filter(
        (b) => !importedBrandNames.includes(b.brandName),
      ),
    [presets, importedBrandNames],
  );

  const completeMutation = useMutation({
    mutationFn: async () => {
      const brandList = skipPresets ? [] : Array.from(selectedBrands);
      const features = Array.from(selectedFeatures);
      return completeOnboarding(features, brandList);
    },
  });

  const toggleBrand = (name: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllFeatures = () => {
    setSelectedFeatures(new Set(FEATURES.map((f) => f.key)));
  };

  const canProceedPresets = skipPresets || selectedBrands.size > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Zer-д тавтай морилно уу</CardTitle>
            <CardDescription>
              {step === "presets"
                ? "Брэнд бүтээгдэхүүний сангаас сонгон импортлох"
                : step === "features"
                  ? "Хүссэн модулиудаа сонгоно уу"
                  : "Бэлэн боллоо!"}
            </CardDescription>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {(["presets", "features", "complete"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : FEATURES_ORDER.indexOf(s) < FEATURES_ORDER.indexOf(step)
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {FEATURES_ORDER.indexOf(s) < FEATURES_ORDER.indexOf(step) ? (
                    <Check className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "h-px w-6",
                      FEATURES_ORDER.indexOf(s) < FEATURES_ORDER.indexOf(step)
                        ? "bg-primary"
                        : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === "presets" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Таны байгууллагын төрөлд тохирсон брэндүүдийн бэлэн
              бүтээгдэхүүнүүдээс сонгон импортлох боломжтой. Та эхлээд хүссэн
              брэндүүдээ сонгоод, дараа нь бүтээгдэхүүн бүрийг сонгон импортлох
              боломжтой.
            </p>

            {brands.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                <Cube className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Одоогоор таны байгууллагын төрөлд тохирсон брэнд байхгүй
                  байна.
                </p>
                <p className="text-xs text-muted-foreground">
                  Дараагийн алхам руу шууд орж болно.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {brands.map((brand) => {
                  const isSelected = selectedBrands.has(brand.brandName);
                  return (
                    <button
                      type="button"
                      key={brand.brandName}
                      onClick={() => toggleBrand(brand.brandName)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                        isSelected &&
                          "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
                        !isSelected && "hover:bg-accent/50",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div className="flex flex-1 items-center gap-3">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.brandName}
                            className="size-8 shrink-0 rounded object-contain"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                            {brand.brandName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {brand.brandName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {brand.count} бүтээгдэхүүн
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSkipPresets(!skipPresets)}
                className={cn(
                  "text-xs underline-offset-4 hover:underline",
                  skipPresets
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60",
                )}
              >
                {skipPresets
                  ? "Импортлох брэнд сонгох"
                  : "Алгасах (дараа тохируулна)"}
              </button>
              <Button
                onClick={() => setStep("features")}
                disabled={!canProceedPresets}
              >
                {skipPresets
                  ? "Үргэлжлүүлэх"
                  : `${selectedBrands.size} брэнд сонгосон`}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {step === "features" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ашиглахыг хүсч буй модулиудаа сонгоно уу. Сонгоогүй модулиуд
                хажуугийн цэснээс нуугдана, хэрэгцээ гарахад Тохиргоо хэсгээс
                идэвхжүүлж болно.
              </p>
              <button
                type="button"
                onClick={selectAllFeatures}
                className="whitespace-nowrap text-xs text-primary underline-offset-4 hover:underline"
              >
                Бүгдийг сонгох
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const isSelected = selectedFeatures.has(feature.key);
                return (
                  <button
                    type="button"
                    key={feature.key}
                    onClick={() => toggleFeature(feature.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      isSelected &&
                        "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
                      !isSelected && "hover:bg-accent/50",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                    <div>
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {selectedFeatures.size} / {FEATURES.length} модуль сонгосон
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("presets")}>
                  Буцах
                </Button>
                <Button
                  onClick={() => {
                    if (selectedFeatures.size === 0) {
                      selectAllFeatures();
                    }
                    setStep("complete");
                  }}
                >
                  {selectedFeatures.size === 0
                    ? "Бүгдийг сонгох"
                    : `${selectedFeatures.size} модуль сонгосон`}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Storefront className="size-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Бүх зүйл бэлэн боллоо!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Та Zer системийг ашиглахад бэлэн боллоо. Та хяналтын самбараасаа
                үндсэн үйлдлүүдээ хийж эхлэх боломжтой.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Хийгдсэн тохиргоо
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <SealCheck
                    className="size-4 text-emerald-600"
                    weight="fill"
                  />
                  <span>Байгууллага үүсгэсэн</span>
                </div>
                {selectedBrands.size > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <SealCheck
                      className="size-4 text-emerald-600"
                      weight="fill"
                    />
                    <span>
                      {selectedBrands.size} брэндийн бүтээгдэхүүн импортлогдлоо
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <SealCheck
                    className="size-4 text-emerald-600"
                    weight="fill"
                  />
                  <span>
                    {selectedFeatures.size > 0
                      ? `${selectedFeatures.size} модуль идэвхжсэн`
                      : "Бүх модуль идэвхжсэн"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Бэлтгэж байна...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Хяналтын самбар руу очих
                </>
              )}
            </Button>

            {completeMutation.isError && (
              <p className="text-center text-sm text-destructive">
                Алдаа гарлаа. Дахин оролдоно уу.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const FEATURES_ORDER = ["presets", "features", "complete"] as const;
