"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCard } from "@/components/TemplateCard";
import { EmptyState } from "@/components/EmptyStates";
import type { Template, TemplateCategory } from "@/types/template";
import { TEMPLATE_CATEGORIES, CATEGORY_LABELS } from "@/types/template";

interface TemplateBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: Template) => void;
}

type FetchState = "idle" | "loading" | "success" | "error";

export function TemplateBrowser({
  open,
  onOpenChange,
  onUseTemplate,
}: TemplateBrowserProps) {
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const loadTemplates = useCallback(async () => {
    setFetchState("loading");
    setErrorMessage("");

    try {
      const url = new URL("/api/templates", window.location.origin);
      const response = await fetch(url.toString(), { cache: "no-store" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      const data = (await response.json()) as { templates: Template[] };
      setTemplates(data.templates ?? []);
      setFetchState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load templates.",
      );
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        void loadTemplates();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open, loadTemplates]);

  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Template Library</SheetTitle>
          <SheetDescription>
            Browse pre-built templates or your saved templates to get started
            quickly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4">
          {/* Category Tabs */}
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="flex flex-col gap-3"
          >
            <TabsList className="w-full overflow-x-auto flex-nowrap gap-0.5">
              <TabsTrigger value="all" className="shrink-0">
                All
              </TabsTrigger>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="shrink-0">
                  {CATEGORY_LABELS[cat]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Loading State */}
            {fetchState === "loading" && (
              <div className="flex flex-col gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {fetchState === "error" && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="text-4xl mb-3 opacity-50">⚠️</div>
                <h3 className="m-0 text-base font-semibold text-text">
                  Failed to load templates
                </h3>
                <p className="mt-1 text-sm text-text-muted max-w-xs">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
                <button
                  type="button"
                  className="mt-4 h-9 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text transition-all hover:bg-surface-2 cursor-pointer"
                  onClick={() => void loadTemplates()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Success State */}
            {fetchState === "success" && (
              <TabsContent value={activeCategory} className="mt-0">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="text-4xl mb-3 opacity-50">📭</div>
                    <h3 className="m-0 text-base font-semibold text-text">
                      {activeCategory === "all"
                        ? "No templates yet"
                        : `No ${CATEGORY_LABELS[activeCategory as TemplateCategory] ?? activeCategory} templates`}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted max-w-xs">
                      {activeCategory === "all"
                        ? "Templates will appear here once created."
                        : "No templates found in this category."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 overflow-y-auto pb-4">
                    <p className="text-xs text-text-muted">
                      {filteredTemplates.length}{" "}
                      {filteredTemplates.length === 1
                        ? "template"
                        : "templates"}
                    </p>
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={onUseTemplate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
