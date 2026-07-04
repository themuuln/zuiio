"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import { TotalsSummary } from "@/components/work-orders/line-items";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";
import { DrawerFooter } from "./_drawer-footer";

// ── Dynamic imports (code-split heavy sections) ────────────────

const sectionLoading = (h: string) => () => (
  <div className={`h-${h} animate-pulse rounded-lg bg-muted/10`} />
);

const WorkOrderServicesSection = dynamic(
  () =>
    import("./_work-order-services-section").then(
      (m) => m.WorkOrderServicesSection,
    ),
  { ssr: false, loading: sectionLoading("24") },
);
const WorkOrderPartsSection = dynamic(
  () =>
    import("./_work-order-parts-section").then((m) => m.WorkOrderPartsSection),
  { ssr: false, loading: sectionLoading("24") },
);
const WorkOrderNotesSection = dynamic(
  () =>
    import("./_work-order-notes-section").then((m) => m.WorkOrderNotesSection),
  { ssr: false, loading: sectionLoading("16") },
);
const WorkOrderTimelineSection = dynamic(
  () =>
    import("./_work-order-timeline-section").then(
      (m) => m.WorkOrderTimelineSection,
    ),
  { ssr: false, loading: sectionLoading("32") },
);

// ── Props ───────────────────────────────────────────────────────

export interface DrawerContentPanelProps {
  wo: WorkOrderDetail;
  orgId: string;
  workOrderId: string;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  lowStockMap: Record<string, { quantity: number; threshold: number }>;
  serviceSearch: string;
  showAddService: boolean;
  onServiceSearchChange: (val: string) => void;
  onAddServiceOpenChange: (open: boolean) => void;
  onAddService: (svc: CatalogServiceItem) => void;
  onRemoveService: (serviceId: string) => Promise<void>;
  onEditServicePriceSave: (id: string, price: number) => Promise<void>;
  onEditServiceQtySave: (id: string, qty: number) => Promise<void>;
  onEditServiceDiscountSave?: (
    id: string,
    amount: number,
    pct: number,
  ) => Promise<void>;
  partSearch: string;
  showAddPart: boolean;
  onPartSearchChange: (val: string) => void;
  onAddPartOpenChange: (open: boolean) => void;
  onAddPart: (part: CatalogPartItem) => void;
  onRemovePart: (partId: string) => Promise<void>;
  onEditPartPriceSave: (id: string, price: number) => Promise<void>;
  onEditPartQtySave: (partId: string, qty: number) => Promise<void>;
  onEditPartDiscountSave?: (
    id: string,
    amount: number,
    pct: number,
  ) => Promise<void>;
  onNotesUpdated: () => void;
  // Totals
  taxRate: number;
  // VAT toggle
  nuatEnabled: boolean;
  onNuatToggle: (checked: boolean) => Promise<void>;
  // Footer props
  saving: boolean;
  confirmStatus: string | null;
  statusNotes: string;
  creatingInvoice: boolean;
  canCancel: boolean;
  canInvoice: boolean;
  invoicePublicToken: string | null;
  onChangeStatus: (status: string, notes?: string) => Promise<void>;
  onConfirmCancel: () => void;
  onStatusNotesChange: (val: string) => void;
  onMarkReady: () => Promise<void>;
  onComplete: () => void;
  onCreateInvoice: () => Promise<void>;
}

// ── Component ───────────────────────────────────────────────────

export function DrawerContentPanel({
  wo,
  orgId,
  workOrderId,
  catalog,
  partsCatalog,
  lowStockMap,
  serviceSearch,
  showAddService,
  onServiceSearchChange,
  onAddServiceOpenChange,
  onAddService,
  onRemoveService,
  onEditServicePriceSave,
  onEditServiceQtySave,
  onEditServiceDiscountSave,
  partSearch,
  showAddPart,
  onPartSearchChange,
  onAddPartOpenChange,
  onAddPart,
  onRemovePart,
  onEditPartPriceSave,
  onEditPartQtySave,
  onEditPartDiscountSave,
  onNotesUpdated,
  taxRate,
  nuatEnabled,
  onNuatToggle,
  saving,
  confirmStatus,
  statusNotes,
  creatingInvoice,
  canCancel,
  canInvoice,
  invoicePublicToken,
  onChangeStatus,
  onConfirmCancel,
  onStatusNotesChange,
  onMarkReady,
  onComplete,
  onCreateInvoice,
}: DrawerContentPanelProps) {
  const t = useTranslations("bayView");
  const locale = useLocale();

  const servicesTotal =
    wo.services?.reduce((s, svc) => s + Number(svc.final_price), 0) ?? 0;
  const partsTotal =
    wo.parts?.reduce((s, p) => s + Number(p.final_price), 0) ?? 0;
  const grandTotal = servicesTotal + partsTotal;
  const discountTotal = wo.discount_total ?? 0;

  return (
    <>
      {/* Scrollable sections area */}
      <div className="relative flex-1 overflow-y-auto min-h-0">
        <VehicleMakeLogo
          make={wo.vehicle?.make}
          size="70%"
          className="absolute inset-0 m-auto pointer-events-none select-none text-primary/[0.03]"
          aria-hidden
        />
        <div className="relative px-3 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left column: services, parts, notes */}
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto">
                <div
                  className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
                  style={{ "--stagger": 0 } as React.CSSProperties}
                >
                  <WorkOrderServicesSection
                    services={wo.services ?? []}
                    catalog={catalog}
                    serviceSearch={serviceSearch}
                    showAddService={showAddService}
                    locale={locale}
                    onServiceSearchChange={onServiceSearchChange}
                    onAddServiceOpenChange={onAddServiceOpenChange}
                    onAddService={onAddService}
                    onRemoveService={onRemoveService}
                    onEditPriceSave={onEditServicePriceSave}
                    onEditQtySave={onEditServiceQtySave}
                    onEditDiscountSave={onEditServiceDiscountSave}
                    t={t}
                  />
                </div>

                <div
                  className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
                  style={{ "--stagger": 1 } as React.CSSProperties}
                >
                  <WorkOrderPartsSection
                    parts={wo.parts ?? []}
                    partsCatalog={partsCatalog}
                    lowStockMap={lowStockMap}
                    partSearch={partSearch}
                    showAddPart={showAddPart}
                    locale={locale}
                    onPartSearchChange={onPartSearchChange}
                    onAddPartOpenChange={onAddPartOpenChange}
                    onAddPart={onAddPart}
                    onRemovePart={onRemovePart}
                    onEditPriceSave={onEditPartPriceSave}
                    onEditQtySave={onEditPartQtySave}
                    onEditDiscountSave={onEditPartDiscountSave}
                    t={t}
                  />
                </div>

                {orgId && workOrderId ? (
                  <div
                    className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
                    style={{ "--stagger": 2 } as React.CSSProperties}
                  >
                    <WorkOrderNotesSection
                      complaint={wo.complaint}
                      diagnosis={wo.diagnosis}
                      notes={wo.notes}
                      orgId={orgId}
                      workOrderId={workOrderId}
                      onUpdated={onNotesUpdated}
                      t={t}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right column: timeline */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-3 self-start">
              <div
                className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
                style={{ "--stagger": 3 } as React.CSSProperties}
              >
                <WorkOrderTimelineSection
                  statusHistory={wo.status_history ?? []}
                  serviceHistory={wo.service_history ?? []}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* НӨАТ + Totals — floating above drawer footer */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <div className="flex flex-col">
                <Label className="text-xs font-medium">
                  {locale === "en" ? "VAT" : "НӨАТ"}
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {locale === "en"
                    ? "Value Added Tax"
                    : "Нэмэгдсэн Өртөгт Татвар"}
                </span>
              </div>
              <Switch checked={nuatEnabled} onCheckedChange={onNuatToggle} />
            </div>
            <TotalsSummary
              servicesTotal={servicesTotal}
              partsTotal={partsTotal}
              grandTotal={grandTotal}
              serviceCount={wo.services?.length ?? 0}
              partCount={wo.parts?.length ?? 0}
              discountTotal={discountTotal}
              taxRate={taxRate}
              nuatEnabled={nuatEnabled}
              locale={locale}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <DrawerFooter
        wo={wo}
        grandTotal={grandTotal}
        invoicePublicToken={invoicePublicToken}
        saving={saving}
        confirmStatus={confirmStatus}
        statusNotes={statusNotes}
        creatingInvoice={creatingInvoice}
        canCancel={canCancel}
        canInvoice={canInvoice}
        onChangeStatus={onChangeStatus}
        onConfirmCancel={onConfirmCancel}
        onStatusNotesChange={onStatusNotesChange}
        onMarkReady={onMarkReady}
        onComplete={onComplete}
        onCreateInvoice={onCreateInvoice}
        t={t}
      />
    </>
  );
}
