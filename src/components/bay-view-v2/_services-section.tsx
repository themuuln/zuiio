"use client";

import { Loader2, Plus, Trash2, Wrench } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceCatalog, GlobalServiceCatalog } from "@/lib/types";

// Extended type for catalog items that may come from global or org catalog
type CatalogServiceItem = ServiceCatalog & { _source?: "org" | "global" };
import type { WorkOrderService } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface ServicesSectionProps {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  serviceSearch: string;
  showAddService: boolean;
  addingServiceId: string | null;
  pendingServicePreview: { name: string; price: number } | null;
  editingPriceId: string | null;
  editingPriceVal: string;
  onServiceSearchChange: (val: string) => void;
  onToggleAddService: () => void;
  onAddService: (svc: CatalogServiceItem) => Promise<void>;
  onRemoveService: (serviceId: string) => Promise<void>;
  onEditPriceStart: (id: string, val: string) => void;
  onEditPriceChange: (val: string) => void;
  onEditPriceSave: (id: string) => Promise<void>;
  onEditPriceCancel: () => void;
  t: (key: string) => string;
}

export function ServicesSection({
  services,
  catalog,
  serviceSearch,
  showAddService,
  addingServiceId,
  pendingServicePreview,
  editingPriceId,
  editingPriceVal,
  onServiceSearchChange,
  onToggleAddService,
  onAddService,
  onRemoveService,
  onEditPriceStart,
  onEditPriceChange,
  onEditPriceSave,
  onEditPriceCancel,
  t,
}: ServicesSectionProps) {
  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center size-5 rounded-md bg-blue-500/10">
            <Wrench className="size-3 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("services")}
          </span>
          {(services?.length ?? 0) > 0 && (
            <Badge variant="outline">{services?.length}</Badge>
          )}
        </div>
      </div>

      {(services ?? []).length === 0 && !pendingServicePreview ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <Wrench className="size-4 text-muted-foreground/40 mb-1.5" />
          <span className="text-xs text-muted-foreground">
            {t("noServicesYet")}
          </span>
        </div>
      ) : (
        <div className="-mx-0.5">
          {/* Header row */}
          <div className="flex items-center gap-2 px-1 mb-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            <div className="flex-1">{t("service")}</div>
            <div className="w-14 text-right">{t("qty")}</div>
            <div className="w-20 text-right">{t("price")}</div>
            <div className="w-7" />
          </div>
          <div className="flex flex-col gap-px">
            {services?.map((svc) => (
              <div
                key={svc.id}
                className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Typography.Text className="text-sm font-medium truncate">
                    {svc.service_name}
                  </Typography.Text>
                </div>
                <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                  {svc.quantity}
                </div>
                <div className="w-20 text-right">
                  {editingPriceId === svc.id ? (
                    <Input
                      type="number"
                      className="w-20 h-7 text-right text-xs font-semibold tabular-nums rounded-sm border-primary/60 bg-background px-1 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={editingPriceVal}
                      onChange={(e) => onEditPriceChange(e.target.value)}
                      onBlur={() => onEditPriceSave(svc.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onEditPriceSave(svc.id);
                        if (e.key === "Escape") onEditPriceCancel();
                      }}
                      autoFocus
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onEditPriceStart(
                          svc.id,
                          String(Number(svc.final_price)),
                        );
                      }}
                      className="font-semibold tabular-nums h-auto px-1 -mx-1 rounded-sm"
                    >
                      {formatMNT(Number(svc.final_price))}
                    </Button>
                  )}
                </div>
                <div className="w-7 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveService(svc.id)}
                    className="text-destructive/60 hover:text-destructive size-6 opacity-0 group-hover:opacity-100"
                    aria-label="Remove service"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingServicePreview && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-primary/30 bg-primary/5 p-1.5">
                <div className="flex-1 min-w-0">
                  <Typography.Text className="text-sm font-medium truncate">
                    {pendingServicePreview.name}
                  </Typography.Text>
                  <Typography.Text className="text-[10px] text-primary/80">
                    Adding service...
                  </Typography.Text>
                </div>
                <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                  1
                </div>
                <div className="w-20 text-right text-xs font-semibold tabular-nums text-primary">
                  {formatMNT(pendingServicePreview.price)}
                </div>
                <div className="w-7 flex justify-center">
                  <Loader2 className="size-3 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Service search dropdown — appears above the Add button */}
      {showAddService && (
        <div className="relative mt-2">
          <Input
            value={serviceSearch}
            onChange={(e) => onServiceSearchChange(e.target.value)}
            placeholder={t("searchServices")}
            className="h-8 text-xs"
            autoFocus
            disabled={!!addingServiceId}
          />
          {serviceSearch && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-lg bg-background shadow-lg max-h-40 overflow-y-auto">
              {catalog
                .filter((s) =>
                  s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
                )
                .slice(0, 8)
                .map((svc) => {
                  const added = services?.some(
                    (s) => s.service_catalog_id === svc.id,
                  );
                  return (
                    <Button
                      variant="ghost"
                      key={svc.id}
                      onClick={() => {
                        if (!added) {
                          onAddService(svc);
                        }
                      }}
                      disabled={added || !!addingServiceId}
                      className="w-full justify-start px-2.5 py-2 text-xs h-auto"
                    >
                      <span className="font-medium truncate mr-2">
                        {svc.name}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {addingServiceId === svc.id && (
                          <Loader2 className="size-3 animate-spin text-primary" />
                        )}
                        <span className="tabular-nums font-medium">
                          {formatMNT(Number(svc.default_price))}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              {catalog.filter((s) =>
                s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
              ).length === 0 && (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  {t("noMatchService")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-width Add button */}
      <Button
        variant="outline"
        onClick={onToggleAddService}
        disabled={!!addingServiceId}
        className="mt-2 w-full border-dashed py-2 text-xs"
      >
        {addingServiceId ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {addingServiceId ? "Adding service..." : t("addService")}
      </Button>
    </section>
  );
}
