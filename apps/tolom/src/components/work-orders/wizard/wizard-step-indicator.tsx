"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "customer", labelKey: "workOrderWizard.customer" },
  { key: "vehicle", labelKey: "workOrderWizard.vehicle" },
  { key: "complaint", labelKey: "workOrderWizard.complaint" },
  { key: "services", labelKey: "workOrderWizard.services" },
  { key: "parts", labelKey: "workOrderWizard.parts" },
  { key: "mechanic", labelKey: "workOrderWizard.mechanic" },
  { key: "summary", labelKey: "workOrderWizard.summary" },
] as const;

export function WizardStepIndicator() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepCards = STEPS.map((step) =>
      document.querySelector(`[data-wizard-step="${step.key}"]`),
    ).filter(Boolean) as HTMLElement[];

    if (stepCards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first section that's significantly visible
        const visible = entries
          .filter((e) => e.intersectionRatio > 0.15)
          .sort((a, b) => {
            const idxA = STEPS.findIndex(
              (s) => s.key === a.target.getAttribute("data-wizard-step"),
            );
            const idxB = STEPS.findIndex(
              (s) => s.key === b.target.getAttribute("data-wizard-step"),
            );
            return idxA - idxB;
          });

        if (visible.length > 0) {
          const first = visible[0];
          const key = first.target.getAttribute("data-wizard-step");
          const idx = STEPS.findIndex((s) => s.key === key);
          if (idx >= 0) setActiveStep(idx);
        }
      },
      {
        threshold: [0.15, 0.5],
        rootMargin: "-60px 0px -40% 0px",
      },
    );

    for (const el of stepCards) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Work order creation progress"
      className="sticky top-12 z-10 border-b border-border/40 bg-background "
    >
      <ol className="flex items-center justify-center gap-0 px-4 py-2.5 text-xs font-medium">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;
          return (
            <li key={step.key} className="flex items-center gap-1.5">
              {i > 0 && (
                <div
                  className={cn(
                    "mx-1 h-px w-4",
                    isPast ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector(`[data-wizard-step="${step.key}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : isPast
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-primary-foreground/20"
                      : isPast
                        ? "bg-primary/15"
                        : "bg-muted",
                  )}
                >
                  {isPast ? "\u2713" : i + 1}
                </span>
                <span className="hidden sm:inline">{t(step.labelKey)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
