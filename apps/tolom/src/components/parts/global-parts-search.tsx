"use client";

import { Import, Loader2, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Typography } from "@/components/ui/typography";
import type { GlobalPartCatalog } from "@/lib/types";

interface GlobalPartsSearchProps {
  /** Organization ID to import parts into */
  orgId: string;
  /** Called after a part is successfully imported */
  onImported?: () => void;
}

/**
 * Search the global parts catalog and import parts into the org's local
 * parts_catalog.
 */
export function GlobalPartsSearch({
  orgId,
  onImported,
}: GlobalPartsSearchProps) {
  const useT = useTranslations as (
    ns: string,
  ) => (key: string, values?: Record<string, string | number>) => string;
  const t = useT("globalCatalog");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalPartCatalog[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setError(null);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/global-catalog/parts?q=${encodeURIComponent(q.trim())}&limit=20`,
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message ?? "Search failed");
      }
      setResults(body.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleImport = useCallback(
    async (part: GlobalPartCatalog) => {
      if (importingIds.has(part.id)) return;

      setImportingIds((prev) => {
        const next = new Set(prev);
        next.add(part.id);
        return next;
      });
      try {
        const res = await fetch("/api/global-catalog/parts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: orgId,
            partIds: [part.id],
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error?.message ?? "Import failed");
        }
        toast.success(t("importSuccess", { name: part.name }));
        onImported?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Import failed",
        );
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(part.id);
          return next;
        });
      }
    },
    [orgId, onImported, t],
  );

  const showSearchPrompt = !query.trim() && !searching && !error && results.length === 0;
  const showNoResults = query.trim() && !searching && !error && results.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        placeholder={t("searchPlaceholder")}
        loading={searching}
        onSearch={handleSearch}
        debounceMs={300}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {searching && results.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {showSearchPrompt && (
        <Typography.Muted className="py-4 text-center">
          {t("searchPrompt")}
        </Typography.Muted>
      )}

      {showNoResults && (
        <Typography.Muted className="py-4 text-center">
          {t("noResults")}
        </Typography.Muted>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <Typography.Small className="px-1 text-muted-foreground">
            {t("resultsCount", { count: results.length })}
          </Typography.Small>
          {results.map((part) => (
            <Item key={part.id}>
              <ItemContent>
                <div className="flex items-center gap-2">
                  <Package className="size-4 shrink-0 text-muted-foreground" />
                  <ItemTitle>{part.name}</ItemTitle>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {part.part_number && (
                    <Badge variant="outline" className="text-xs">
                      {part.part_number}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {part.category}
                  </Badge>
                  {part.name_mn && (
                    <Typography.Muted className="text-xs">
                      {part.name_mn}
                    </Typography.Muted>
                  )}
                </div>
              </ItemContent>
              <ItemActions>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleImport(part)}
                  disabled={importingIds.has(part.id)}
                >
                  {importingIds.has(part.id) ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("importing")}
                    </>
                  ) : (
                    <>
                      <Import className="size-3.5" />
                      {t("import")}
                    </>
                  )}
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
      )}
    </div>
  );
}
