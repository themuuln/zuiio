"use client";

import { Trash2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/search-input";
import { useWizardContext } from "./wizard-context";
import { useTranslations } from "next-intl";

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ServicesSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="size-4" />
          {t("services")}
          {ctx.serviceLines.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {ctx.serviceLines.length} {t("services")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Service search */}
        <div className="relative">
          <SearchInput
            placeholder={t("searchServicesToAdd")}
            loading={false}
            onSearch={ctx.setServiceSearch}
            debounceMs={300}
          />
          {ctx.serviceSearch && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-60 overflow-y-auto">
              {ctx.catalog
                .filter(
                  (s) =>
                    s.name
                      .toLowerCase()
                      .includes(ctx.serviceSearch.toLowerCase()) ||
                    (s.category &&
                      s.category
                        .toLowerCase()
                        .includes(ctx.serviceSearch.toLowerCase())),
                )
                .slice(0, 12)
                .map((svc) => {
                  const history = ctx.priceHistory[svc.id];
                  const last = history?.last_price ?? Number(svc.default_price);
                  const isAdded = ctx.serviceLines.some(
                    (s) => s.service_catalog_id === svc.id,
                  );
                  return (
                    <button
                      type="button"
                      key={svc.id}
                      onClick={() => {
                        if (!isAdded) {
                          ctx.addService(svc);
                          ctx.setServiceSearch("");
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
                          {formatMNT(Number(svc.default_price))}
                        </span>
                        {last !== Number(svc.default_price) && last > 0 && (
                          <span className="ml-2 text-xs text-amber-600">
                            {t("lastSold", { price: formatMNT(last) })}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              {ctx.catalog.filter(
                (s) =>
                  s.name
                    .toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()) ||
                  (s.category &&
                    s.category
                      .toLowerCase()
                      .includes(ctx.serviceSearch.toLowerCase())),
              ).length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {t("noServicesMatch")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service lines */}
        {ctx.serviceLines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {ctx.serviceLines.map((svc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 hover:bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{svc.name}</p>
                    {svc.last_price && (
                      <p className="text-[11px] text-amber-600">
                        Last sold: {formatMNT(svc.last_price)}
                      </p>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={svc.quantity}
                    onChange={(e) =>
                      ctx.updateService(idx, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                    className="w-14 h-10 text-center"
                    min={1}
                    aria-label="Quantity"
                  />
                  <Input
                    type="number"
                    value={svc.base_price}
                    onChange={(e) =>
                      ctx.updateService(idx, "base_price", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 h-10"
                    aria-label="Price"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={svc.discount_amount_mnt || ""}
                      onChange={(e) =>
                        ctx.updateService(
                          idx,
                          "discount_amount_mnt",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-20 h-10"
                      placeholder={t("discount")}
                      aria-label="Discount amount"
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                    {formatMNT(svc.final_price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => ctx.removeService(idx)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                    aria-label="Remove service"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ctx.serviceLines.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">
            {t("noServicesFound")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
