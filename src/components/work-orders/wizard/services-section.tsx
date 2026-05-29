"use client";

import { Check, Clock, Plus, Trash2, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { formatCurrency } from "@/lib/utils";
import { useWizardContext } from "./wizard-context";
import { Typography } from "@/components/ui/typography";
import { ServiceForm } from "@/components/services/service-form";

export function ServicesSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");
  const [showQuickService, setShowQuickService] = useState(false);

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
      <CardContent className="flex flex-col gap-4">
        {/* From last visit suggestions */}
        {ctx.showLastVisitSuggestions &&
          (ctx.lastVisitData?.services.length ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {t("fromLastVisit")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto min-h-[var(--ui-touch-target)]"
                  onClick={ctx.addAllFromLastVisit}
                >
                  <Check className="size-3.5 mr-1" />
                  {t("addAll")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[var(--ui-touch-target)]"
                  onClick={() => ctx.setShowLastVisitSuggestions(false)}
                >
                  {t("dismiss")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ctx.lastVisitData?.services.map((svc) => {
                  const isAdded = ctx.serviceLines.some(
                    (s) =>
                      s.service_catalog_id === svc.service_catalog_id &&
                      svc.service_catalog_id,
                  );
                  return (
                    <Button
                      key={svc.service_catalog_id ?? svc.service_name}
                      variant={isAdded ? "default" : "outline"}
                      disabled={isAdded}
                      onClick={() => {
                        const catItem = ctx.catalog.find(
                          (c) => c.id === svc.service_catalog_id,
                        );
                        if (catItem) {
                          ctx.addService(catItem);
                        }
                      }}
                      data-slot="touch-target"
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm ${
                        isAdded
                          ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : "border-amber-200 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
                      }`}
                    >
                      {isAdded && <Check className="size-3.5" />}
                      <span className="font-medium">{svc.service_name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(svc.unit_price)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Service search */}
        <SearchInput
          placeholder={t("searchServicesToAdd")}
          loading={false}
          onSearch={ctx.setServiceSearch}
          debounceMs={300}
        />
        {ctx.serviceSearch && (
          <div className="flex flex-col gap-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {/* Org-level services */}
            {ctx.catalog
              .filter(
                (s) =>
                  s.name
                    .toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()) ||
                  s.category
                    ?.toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()),
              )
              .slice(0, 12)
              .map((svc) => {
                const vehiclePrice = ctx.vehicleServicePrices[svc.id];
                const history = ctx.priceHistory[svc.id];
                const last =
                  vehiclePrice ??
                  history?.last_price ??
                  Number(svc.default_price);
                const isAdded = ctx.serviceLines.some(
                  (s) => s.service_catalog_id === svc.id,
                );
                return (
                  <Button
                    variant="ghost"
                    key={svc.id}
                    onClick={() => {
                      if (!isAdded) {
                        ctx.addService(svc);
                        ctx.setServiceSearch("");
                      }
                    }}
                    disabled={isAdded}
                    className={`w-full justify-between p-3 min-h-[48px] h-auto ${
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
                        <span
                          className={`ml-2 text-xs ${Number(svc.default_price) <= last ? "text-green-600" : "text-amber-600"}`}
                        >
                          {Number(svc.default_price) <= last ? "✓ " : "↑ "}
                          {t("lastSold", { price: formatCurrency(last) })}
                        </span>
                      )}
                    </div>
                  </Button>
                );
              })}
            {/* Global catalog suggestions (if not in org catalog) */}
            {ctx.globalServices
              .filter(
                (s) =>
                  !ctx.catalog.some(
                    (c) => c.name.toLowerCase() === s.name.toLowerCase(),
                  ) &&
                  (s.name
                    .toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()) ||
                    s.category
                      ?.toLowerCase()
                      .includes(ctx.serviceSearch.toLowerCase())),
              )
              .slice(0, 6)
              .map((svc) => (
                <Button
                  variant="ghost"
                  key={`global-${svc.id}`}
                  onClick={() => {
                    // Add as custom service (no catalog id)
                    ctx.setServiceSearch("");
                  }}
                  className="w-full justify-between p-3 min-h-[48px] h-auto border-dashed border border-muted-foreground/20"
                >
                  <div>
                    <span className="text-sm font-medium">{svc.name}</span>
                    {svc.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {svc.category}
                      </span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground italic">
                      global
                    </span>
                  </div>
                </Button>
              ))}
            {ctx.catalog.filter(
              (s) =>
                s.name
                  .toLowerCase()
                  .includes(ctx.serviceSearch.toLowerCase()) ||
                s.category
                  ?.toLowerCase()
                  .includes(ctx.serviceSearch.toLowerCase()),
            ).length === 0 &&
              ctx.globalServices.filter(
                (s) =>
                  s.name
                    .toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()) ||
                  s.category
                    ?.toLowerCase()
                    .includes(ctx.serviceSearch.toLowerCase()),
              ).length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {t("noServicesMatch")}
                </div>
              )}
          </div>
        )}

        {!showQuickService ? (
          <Button
            variant="outline"
            onClick={() => setShowQuickService(true)}
            className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
          >
            <Plus className="size-4" />
            Quick Create Service
          </Button>
        ) : (
          <div className="border rounded-lg p-4 bg-muted/20 mt-2">
            <Typography.Text className="text-sm font-semibold mb-3 block">
              New Service
            </Typography.Text>
            <ServiceForm
              mode="quick"
              onSuccess={(svc) => {
                ctx.addService(svc);
                setShowQuickService(false);
              }}
              onCancel={() => setShowQuickService(false)}
            />
          </div>
        )}

        {/* Service lines */}
        {ctx.serviceLines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {ctx.serviceLines.map((svc, idx) => (
                <div
                  key={svc.service_catalog_id ?? `wsvc-${idx}`}
                  className="flex flex-wrap items-center gap-2 p-3 hover:bg-muted/20"
                >
                  <div className="flex-1 min-w-[120px]">
                    <Typography.Text className="text-sm font-medium truncate">
                      {svc.name}
                    </Typography.Text>
                    {svc.last_price && (
                      <Typography.Text
                        className={`text-[11px] ${svc.base_price <= svc.last_price ? "text-green-600" : "text-amber-600"}`}
                      >
                        {svc.base_price <= svc.last_price ? "✓ " : "↑ "}
                        {t("lastSoldShort", {
                          price: formatCurrency(svc.last_price),
                        })}
                      </Typography.Text>
                    )}
                  </div>
                  <NumericKeypad
                    value={svc.quantity}
                    onChange={(val) =>
                      ctx.updateService(idx, "quantity", Math.round(val) || 1)
                    }
                  >
                    <Input
                      value={svc.quantity}
                      className="w-16 h-11 text-center cursor-pointer"
                      min={1}
                      aria-label="Quantity"
                    />
                  </NumericKeypad>
                  <NumericKeypad
                    value={svc.base_price}
                    onChange={(val) =>
                      ctx.updateService(idx, "base_price", val)
                    }
                  >
                    <Input
                      value={svc.base_price}
                      className="w-28 h-11 cursor-pointer"
                      aria-label="Price"
                    />
                  </NumericKeypad>
                  <div className="flex items-center gap-1">
                    <NumericKeypad
                      value={svc.discount_amount_mnt}
                      onChange={(val) =>
                        ctx.updateService(idx, "discount_amount_mnt", val)
                      }
                    >
                      <Input
                        value={svc.discount_amount_mnt || ""}
                        className="w-24 h-11 cursor-pointer"
                        placeholder={t("discount")}
                        aria-label="Discount amount"
                      />
                    </NumericKeypad>
                  </div>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                    {formatCurrency(svc.final_price)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => ctx.removeService(idx)}
                    data-slot="touch-target"
                    className="min-w-[44px]"
                    aria-label="Remove service"
                  >
                    <Trash2 className="size-5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ctx.serviceLines.length === 0 && !ctx.showLastVisitSuggestions && (
          <Typography.Muted className="text-sm text-muted-foreground text-center py-3">
            {t("noServicesFound")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}
