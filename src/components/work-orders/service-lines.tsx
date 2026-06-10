"use client";

import { Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Typography } from "@/components/ui/typography";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import type { ServiceCatalog } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";

export interface ServiceLine {
  service_catalog_id: string | null;
  name: string;
  base_price: number;
  quantity: number;
  discount_amount_mnt: number;
  discount_percent: number;
  final_price: number;
  last_price?: number;
}

interface ServiceLinesProps {
  catalog: ServiceCatalog[];
  priceHistory: Record<string, number>;
  lines: ServiceLine[];
  onAdd: (svc: ServiceCatalog) => void;
  onUpdate: (
    idx: number,
    field: keyof ServiceLine,
    value: number | string,
  ) => void;
  onRemove: (idx: number) => void;
}

export function ServiceLines({
  catalog,
  priceHistory,
  lines,
  onAdd,
  onUpdate,
  onRemove,
}: ServiceLinesProps) {
  const [serviceSearch, setServiceSearch] = useState("");
  const t = useTranslations("workOrderDetail");
  const tc = useTranslations("common");

  const filteredCatalog = useFuzzySearch(catalog, serviceSearch, {
    keys: ["name", "category"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="size-4" />
          {t("services")}
          {lines.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {t("serviceCount", { count: lines.length })}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Service search */}
        <SearchInput
          placeholder={t("searchServices")}
          loading={false}
          onSearch={setServiceSearch}
          debounceMs={300}
        />
        {serviceSearch && (
          <div className="flex flex-col gap-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {filteredCatalog.slice(0, 12).map((svc) => {
              const last = priceHistory[svc.name] ?? Number(svc.default_price);
              const isAdded = lines.some(
                (s) => s.service_catalog_id === svc.id,
              );
              return (
                <Button
                  variant="ghost"
                  key={svc.id}
                  onClick={() => {
                    if (!isAdded) {
                      onAdd(svc);
                      setServiceSearch("");
                    }
                  }}
                  disabled={isAdded}
                  className={`w-full justify-between p-3 min-h-[48px] h-auto ${
                    isAdded ? "opacity-40" : ""
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium">
                      <HighlightText text={svc.name} query={serviceSearch} />
                    </span>
                    {svc.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        <HighlightText
                          text={svc.category}
                          query={serviceSearch}
                        />
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(Number(svc.default_price))}
                    </span>
                    {last !== Number(svc.default_price) && last > 0 && (
                      <span
                        className={`ml-2 text-xs ${Number(svc.default_price) <= last ? "text-green-600" : "text-amber-600"}`}
                      >
                        last: {formatCurrency(last)}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {t("noServicesFound")}
              </div>
            )}
          </div>
        )}

        {/* Service lines */}
        {lines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {lines.map((svc, idx) => (
                <Item
                  key={svc.service_catalog_id ?? `svc-${idx}`}
                  variant="muted"
                  className="gap-2 px-3 py-2.5"
                >
                  <ItemContent className="gap-0.5">
                    <ItemTitle className="text-sm">{svc.name}</ItemTitle>
                    {svc.last_price && (
                      <Typography.Text
                        className={`text-[11px] ${svc.base_price <= svc.last_price ? "text-green-600" : "text-amber-600"}`}
                      >
                        {svc.base_price <= svc.last_price ? "✓" : "↑"} Last:{" "}
                        {formatCurrency(svc.last_price)}
                      </Typography.Text>
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Input
                      type="number"
                      value={svc.quantity}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          onUpdate(idx, "quantity", 0);
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (!Number.isNaN(n)) onUpdate(idx, "quantity", n);
                      }}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isNaN(n) || n < 1)
                          onUpdate(idx, "quantity", 1);
                      }}
                      className="w-14 h-10 text-center"
                      min={1}
                      aria-label={tc("quantity")}
                    />
                    <span className="text-sm font-semibold tabular-nums w-20 text-right">
                      {formatCurrency(svc.final_price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemove(idx)}
                      className="shrink-0 min-w-[44px] min-h-[var(--ui-touch-target)]"
                      aria-label={t("removeItem", { name: svc.name })}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
