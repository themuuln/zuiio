"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { reportServerError } from "@/lib/sentry-report-server";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tolom_bay_view_walkthrough_seen";

interface Step {
  target: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right";
}

export function BayViewWalkthrough() {
  const t = useTranslations("bayView");
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-slot="bay-view-toolbar"]',
        title: t("walkthroughToolbarTitle"),
        description: t("walkthroughToolbarDesc"),
        placement: "bottom",
      },
      {
        target: '[data-slot="bay-view-kpi-cards"]',
        title: t("walkthroughKpiTitle"),
        description: t("walkthroughKpiDesc"),
        placement: "bottom",
      },
      {
        target: '[data-slot="bay-view-grid"]',
        title: t("walkthroughBaysTitle"),
        description: t("walkthroughBaysDesc"),
        placement: "bottom",
      },
      {
        target: '[data-slot="bay-view-footer-buttons"]',
        title: t("walkthroughActionsTitle"),
        description: t("walkthroughActionsDesc"),
        placement: "top",
      },
    ],
    [t],
  );

  const hasVisited = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      reportServerError("Unexpected error");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!hasVisited()) {
      // Delay start to let the page render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasVisited]);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      // Fallback: center the tooltip
      setTargetRect(null);
      setPosition({
        top: 120,
        left: Math.max(window.innerWidth / 2 - 180, 24),
      });
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    const width = 360;
    const gap = 16;
    let top = 0;
    let left = 0;

    switch (step.placement) {
      case "bottom":
        top = rect.bottom + gap;
        left = Math.max(
          24,
          Math.min(
            rect.left + rect.width / 2 - width / 2,
            window.innerWidth - width - 24,
          ),
        );
        break;
      case "top":
        top = rect.top - gap - 120;
        left = Math.max(
          24,
          Math.min(
            rect.left + rect.width / 2 - width / 2,
            window.innerWidth - width - 24,
          ),
        );
        break;
      case "left":
        top = Math.max(24, rect.top + rect.height / 2 - 60);
        left = rect.left - width - gap;
        break;
      case "right":
        top = Math.max(24, rect.top + rect.height / 2 - 60);
        left = rect.right + gap;
        break;
    }

    setPosition({ top: Math.max(24, top), left });
  }, [currentStep, steps]);

  useEffect(() => {
    if (visible) {
      positionTooltip();
      window.addEventListener("resize", positionTooltip);
      return () => window.removeEventListener("resize", positionTooltip);
    }
  }, [visible, positionTooltip]);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const finish = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      reportServerError("Unexpected error");
      // silent
    }
  };

  if (!visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={finish}
        aria-hidden
      />

      {/* Target highlight */}
      {targetRect && (
        <div
          className="fixed z-[121] rounded-lg ring-4 ring-primary/60 pointer-events-none transition-[transform,border-color,box-shadow] duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className={cn(
          "fixed z-[122] w-[min(360px,calc(100vw-48px))] rounded-xl border border-border bg-card p-5 shadow-xl transition-[transform,opacity] duration-300",
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Progress dots */}
        <div className="mb-3 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-200",
                i === currentStep ? "w-5 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <h3 className="text-sm font-semibold text-foreground">
          {steps[currentStep]?.title ?? ""}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {steps[currentStep]?.description ?? ""}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            {t("skip")}
          </Button>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={isFirst}
              className="h-7 gap-1 text-xs"
            >
              <ArrowLeft className="size-3" />
              {t("back")}
            </Button>
            <Button size="sm" onClick={next} className="h-7 gap-1 text-xs">
              {isLast ? t("gotIt") : t("next")}
              {!isLast && <ArrowRight className="size-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
