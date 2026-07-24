"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import type { PackageDto } from "@/lib/catalog";
import { formatData, formatMnt } from "@/lib/format";

type DataFilter = "all" | "small" | "medium" | "large";

function matchesData(pkg: PackageDto, filter: DataFilter): boolean {
  if (filter === "all") return true;
  if (pkg.dataMb === null) return filter === "large";
  const gb = pkg.dataMb / 1024;
  if (filter === "small") return gb <= 3;
  if (filter === "medium") return gb > 3 && gb <= 10;
  return gb > 10;
}

export function PackageList({ packages }: { packages: PackageDto[] }) {
  const t = useTranslations("packages");
  const tc = useTranslations("common");
  const [dataFilter, setDataFilter] = useState<DataFilter>("all");

  const filtered = useMemo(
    () => packages.filter((p) => matchesData(p, dataFilter)),
    [packages, dataFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={dataFilter}
        onValueChange={(v) => setDataFilter(v as DataFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="small">≤3 GB</TabsTrigger>
          <TabsTrigger value="medium">5–10 GB</TabsTrigger>
          <TabsTrigger value="large">10+ GB</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">{t("empty")}</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {pkg.isUnlimited ? tc("unlimited") : formatData(pkg.dataMb)}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {tc("days", { count: pkg.validityDays })}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {pkg.coverageCountries.length > 1 && (
                    <Badge variant="secondary">
                      {pkg.coverageCountries.length} 🌍
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-lg font-bold">{formatMnt(pkg.retailMnt)}</p>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/packages/${pkg.id}`} />}
                >
                  {t("buy")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
