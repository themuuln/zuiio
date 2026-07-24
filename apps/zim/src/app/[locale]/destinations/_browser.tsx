"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DestinationCard } from "@/components/destination-card";
import { Input } from "@/components/ui/input";
import type { DestinationDto } from "@/lib/catalog";

export function DestinationsBrowser({
  destinations,
}: {
  destinations: DestinationDto[];
}) {
  const t = useTranslations("destinations");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) =>
        d.nameEn.toLowerCase().includes(q) ||
        d.nameMn.toLowerCase().includes(q),
    );
  }, [destinations, query]);

  const countries = filtered.filter((d) => d.kind === "country");
  const regional = filtered.filter((d) => d.kind !== "country");

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="max-w-sm"
        autoFocus={false}
      />

      {filtered.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      )}

      {countries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((dest) => (
            <DestinationCard key={dest.slug} dest={dest} />
          ))}
        </div>
      )}

      {regional.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">
            {locale === "mn" ? t("regional") : t("regional")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regional.map((dest) => (
              <DestinationCard key={dest.slug} dest={dest} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
