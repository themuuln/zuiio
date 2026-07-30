"use client";

import {
  ArrowRight,
  CopySimple,
  Globe,
  Sparkle,
  Storefront,
  X,
} from "@phosphor-icons/react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { suggestDomainNamesAction, suggestStoreNamesAction } from "./actions";

// ── Page Component ───────────────────────────────────────────────
export default function AiNamingPage() {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [businessType, setBusinessType] = useState("");
  const [keywords, setKeywords] = useState("");

  // Results state
  const [storeNames, setStoreNames] = useState<string[] | null>(null);
  const [domains, setDomains] = useState<string[] | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [generatingDomains, setGeneratingDomains] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Generate store names ──────────────────────────────────────
  const handleGenerateNames = useCallback(() => {
    if (!businessType.trim()) {
      toast.error("Бизнесийн төрөл оруулна уу");
      return;
    }

    setStoreNames(null);
    setDomains(null);
    setSelectedName(null);
    setError(null);

    const fd = new FormData();
    fd.set("businessType", businessType.trim());
    fd.set("keywords", keywords.trim());

    startTransition(async () => {
      const result = await suggestStoreNamesAction(fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.names) {
        setStoreNames(result.names);
      }
    });
  }, [businessType, keywords]);

  // ── Generate domains for a selected name ──────────────────────
  const handleGenerateDomains = useCallback((name: string) => {
    setSelectedName(name);
    setDomains(null);
    setGeneratingDomains(true);
    setError(null);

    const fd = new FormData();
    fd.set("storeName", name);

    startTransition(async () => {
      const result = await suggestDomainNamesAction(fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.domains) {
        setDomains(result.domains);
      }
      setGeneratingDomains(false);
    });
  }, []);

  // ── Copy to clipboard ─────────────────────────────────────────
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа!");
  }, []);

  // ── Reset ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStoreNames(null);
    setDomains(null);
    setSelectedName(null);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <PageShell
      title="AI Нэр Шинээ"
      description="Бизнесийн төрөл болон түлхүүр үгэнд тулгуурлан онлайн дэлгүүрийн нэр, домэйн санал болгох"
    >
      <Card className="mx-auto max-w-2xl">
        <CardContent className="px-6 py-8">
          <div className="space-y-8">
            {/* ── Input section ── */}
            <div>
              <Label htmlFor="businessType" className="text-base font-semibold">
                Бизнесийн төрөл
              </Label>
              <p className="mb-2 text-sm text-muted-foreground">
                Онлайн дэлгүүрийн төрөл
              </p>
              <Input
                id="businessType"
                placeholder="Жишээ: Гар урлал, Хувцас, Хүнс"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isPending}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="keywords" className="text-base font-semibold">
                Түлхүүр үгс
              </Label>
              <p className="mb-2 text-sm text-muted-foreground">
                Нэрэнд тусгах үгс (таслалаар тусгаарлана)
              </p>
              <Textarea
                id="keywords"
                placeholder="Жишээ: Монгол, уламжлалт, бэлэг, гар хийцийн"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isPending}
                className="mt-1.5"
                rows={2}
              />
            </div>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleGenerateNames}
              disabled={isPending || !businessType.trim()}
            >
              {isPending && !storeNames ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Санал болгож байна...
                </>
              ) : (
                <>
                  <Sparkle className="size-5" weight="bold" />
                  Нэр санал болгох
                </>
              )}
            </Button>

            {/* ── Loading skeleton ── */}
            {isPending && !storeNames && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            )}

            {/* ── Store name suggestions ── */}
            {storeNames && !isPending && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Санал болгож буй нэрс</h3>
                    <p className="text-sm text-muted-foreground">
                      Дэлгүүрийн нэрээ сонгоод домэйн шалгах
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    onClick={handleReset}
                  >
                    <X className="size-4" weight="bold" />
                    Цэвэрлэх
                  </Button>
                </div>

                <div className="grid gap-3">
                  {storeNames.map((name, i) => {
                    const isSelected = selectedName === name;
                    return (
                      <Card
                        key={`name-${i}`}
                        size="sm"
                        className={
                          isSelected
                            ? "border-primary ring-1 ring-primary/20"
                            : ""
                        }
                      >
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Storefront className="size-5" weight="bold" />
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                Онлайн дэлгүүр
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleCopy(name)}
                            >
                              <CopySimple className="size-3.5" weight="bold" />
                              Хуулах
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleGenerateDomains(name)}
                              disabled={generatingDomains && isSelected}
                            >
                              {generatingDomains && isSelected ? (
                                <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <ArrowRight
                                  className="size-3.5"
                                  weight="bold"
                                />
                              )}
                              Домэйн
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Domain suggestions ── */}
            {domains && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    "{selectedName}" — Домэйн санал
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Боломжтой домэйн нэрс
                  </p>
                </div>

                <div className="grid gap-2">
                  {domains.map((domain, i) => (
                    <div
                      key={`domain-${i}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Globe
                          className="size-4 text-muted-foreground"
                          weight="bold"
                        />
                        <code className="text-sm font-medium">{domain}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleCopy(domain)}
                      >
                        <CopySimple className="size-3.5" weight="bold" />
                        Хуулах
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Generating domains loading ── */}
            {generatingDomains && !domains && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={`dom-skel-${i}`}
                    className="h-12 w-full rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* ── Error banner ── */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
