"use client";

import { Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ServiceCatalog } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
  onUpdate: (idx: number, field: keyof ServiceLine, value: number | string) => void;
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

  const filteredCatalog = serviceSearch
    ? catalog.filter(
        (s) =>
          s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
          (s.category &&
            s.category.toLowerCase().includes(serviceSearch.toLowerCase())),
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="size-4" />
          Services
          {lines.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {lines.length} service{lines.length !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Service search */}
        <div className="relative">
          <SearchInput
            placeholder="Search services to add..."
            loading={false}
            onSearch={setServiceSearch}
            debounceMs={300}
          />
          {serviceSearch && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-60 overflow-y-auto">
              {filteredCatalog.slice(0, 12).map((svc) => {
                const last =
                  priceHistory[svc.name] ?? Number(svc.default_price);
                const isAdded = lines.some(
                  (s) => s.service_catalog_id === svc.id,
                );
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => {
                      if (!isAdded) {
                        onAdd(svc);
                        setServiceSearch("");
                      }
                    }}
                    disabled={isAdded}
                    className={`flex items-center justify-between w-full p-3 text-left transition-colors hover:bg-muted/50 min-h-[48px] ${
                      isAdded ? "opacity-40" : ""
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium">{svc.name}</span>
                      {svc.category && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {svc.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(svc.default_price))}
                      </span>
                      {last !== Number(svc.default_price) && last > 0 && (
                        <span className={`ml-2 text-xs ${Number(svc.default_price) <= last ? 'text-green-600' : 'text-amber-600'}`}>
                          last: {formatCurrency(last)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredCatalog.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No services found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service lines */}
        {lines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {lines.map((svc, idx) => (
                <div
                  key={svc.service_catalog_id ?? `svc-${idx}`}
                  className="flex items-center gap-2 p-3 hover:bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{svc.name}</p>
                    {svc.last_price && (
                      <p className={`text-[11px] ${svc.base_price <= svc.last_price ? 'text-green-600' : 'text-amber-600'}`}>
                        {svc.base_price <= svc.last_price ? '✓' : '↑'} Last: {formatCurrency(svc.last_price)}
                      </p>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={svc.quantity}
                    onChange={(e) =>
                      onUpdate(
                        idx,
                        "quantity",
                        parseInt(e.target.value, 10) || 1,
                      )
                    }
                    className="w-14 h-10 text-center"
                    min={1}
                    aria-label="Quantity"
                  />
                  <span className="text-sm font-semibold tabular-nums w-20 text-right">
                    {formatCurrency(svc.final_price)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(idx)}
                    className="shrink-0 min-w-[44px] min-h-[var(--ui-touch-target)]"
                    aria-label={`Remove ${svc.name}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
