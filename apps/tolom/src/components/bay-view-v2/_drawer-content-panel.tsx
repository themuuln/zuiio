"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import { TotalsSummary } from "@/components/work-orders/line-items";
import type { WorkOrderPart, WorkOrderService } from "@/lib/types";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { DrawerFooter } from "./_drawer-footer";
import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";

// ── Dynamic imports (code-split heavy sections) ────────────────

const sectionLoading = (h: string) => () => (
  <div className={`h-${h} animate-pulse rounded-lg bg-muted/10`} />
);

const WorkOrderServicesSection = dynamic(
  () => import("./_services-section").then((m) => m.ServicesSection),
  { ssr: false, loading: sectionLoading("24") },
);
const WorkOrderPartsSection = dynamic(
  () => import("./_parts-section").then((m) => m.PartsSection),
  { ssr: false, loading: sectionLoading("24") },
);
const WorkOrderNotesSection = dynamic(
  () => import("./_notes-section").then((m) => m.NotesSection),
  { ssr: false, loading: sectionLoading("16") },
);
const WorkOrderTimelineSection = dynamic(
  () => import("./_status-timeline").then((m) => m.StatusTimeline),
  { ssr: false, loading: sectionLoading("32") },
);

// ── Props ───────────────────────────────────────────────────────

export interface DrawerContentPanelProps {
  wo: WorkOrderDetail;
  orgId: string;
  workOrderId: string;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  isFullScreen?: boolean;
  onAddServiceOpenChange: (open: boolean) => void;
  onEditServicePriceSave: (id: string, price: number) => Promise<void>;
  onEditServiceQtySave: (id: string, qty: number) => Promise<void>;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPartPriceSave: (id: string, price: number) => Promise<void>;
  onEditPartQtySave: (partId: string, qty: number) => Promise<void>;
  lastAddedServiceId?: string | null;
  lastAddedPartId?: string | null;
  onNotesUpdated: () => void;
  // Totals
  taxRate: number;
  // VAT toggle
  nuatEnabled: boolean;
  onNuatToggle: (checked: boolean) => Promise<void>;
  // Footer props
  saving: boolean;
  pendingAction?: string | null;
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

// ── Memoized zones ──────────────────────────────────────────────
// Each zone receives only the fields it needs from `wo`,
// so it re-renders only when its specific data changes.

const MemoizedServicesZone = memo(function MemoizedServicesZone({
  services,
  catalog,
  locale,
  isFullScreen,
  onAddServiceOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedServiceId,
}: {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  locale: string;
  isFullScreen?: boolean;
  onAddServiceOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (id: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedServiceId?: string | null;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 0 } as React.CSSProperties}
    >
      <WorkOrderServicesSection
        services={services}
        catalog={catalog}
        locale={locale}
        isFullScreen={isFullScreen}
        onAddServiceOpenChange={onAddServiceOpenChange}
        onEditPriceSave={onEditPriceSave}
        onEditQtySave={onEditQtySave}
        t={t}
        lastAddedServiceId={lastAddedServiceId}
      />
    </div>
  );
});

const MemoizedPartsZone = memo(function MemoizedPartsZone({
  parts,
  partsCatalog,
  locale,
  onAddPartOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedPartId,
}: {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  locale: string;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (partId: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedPartId?: string | null;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 1 } as React.CSSProperties}
    >
      <WorkOrderPartsSection
        parts={parts}
        partsCatalog={partsCatalog}
        locale={locale}
        onAddPartOpenChange={onAddPartOpenChange}
        onEditPriceSave={onEditPriceSave}
        onEditQtySave={onEditQtySave}
        t={t}
        lastAddedPartId={lastAddedPartId}
      />
    </div>
  );
});

const MemoizedNotesZone = memo(function MemoizedNotesZone({
  complaint,
  diagnosis,
  notes,
  orgId,
  workOrderId,
  onUpdated,
  t,
}: {
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  orgId: string;
  workOrderId: string;
  onUpdated: () => void;
  t: (key: string) => string;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 2 } as React.CSSProperties}
    >
      <WorkOrderNotesSection
        complaint={complaint}
        diagnosis={diagnosis}
        notes={notes}
        orgId={orgId}
        workOrderId={workOrderId}
        onUpdated={onUpdated}
        t={t}
      />
    </div>
  );
});

const MemoizedTimelineZone = memo(function MemoizedTimelineZone({
  statusHistory,
  serviceHistory,
  t,
}: {
  statusHistory: WorkOrderDetail["status_history"];
  serviceHistory: WorkOrderDetail["service_history"];
  t: (key: string) => string;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 3 } as React.CSSProperties}
    >
      <WorkOrderTimelineSection
        mode="status"
        statusHistory={statusHistory}
        serviceHistory={serviceHistory}
        t={t}
      />
    </div>
  );
});

// ── Component ───────────────────────────────────────────────────

export function DrawerContentPanel({
  wo,
  orgId,
  workOrderId,
  catalog,
  partsCatalog,
  isFullScreen,
  onAddServiceOpenChange,
  onEditServicePriceSave,
  onEditServiceQtySave,
  onAddPartOpenChange,
  onEditPartPriceSave,
  onEditPartQtySave,
  lastAddedServiceId,
  lastAddedPartId,
  onNotesUpdated,
  taxRate,
  nuatEnabled,
  onNuatToggle,
  saving,
  pendingAction,
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

  // ── Decompose wo into field-level references ──
  // Each memoized zone depends only on the fields it uses,
  // so it won't re-render when unrelated fields change.
  const services = wo.services ?? [];
  const parts = wo.parts ?? [];
  const statusHistory = wo.status_history ?? [];
  const serviceHistory = wo.service_history ?? [];
  const { complaint, diagnosis, notes } = wo;

  // ── Memoized totals ──
  const servicesTotal = useMemo(
    () => services.reduce((s, svc) => s + Number(svc.final_price), 0),
    [services],
  );
  const partsTotal = useMemo(
    () => parts.reduce((s, p) => s + Number(p.final_price), 0),
    [parts],
  );
  const grandTotal = servicesTotal + partsTotal;
  const discountTotal = wo.discount_total ?? 0;

  return (
    <>
      {/* Scrollable sections area */}
      <div className="relative flex-1 overflow-y-auto min-h-0 lg:overflow-hidden">
        <VehicleMakeLogo
          make={wo.vehicle?.make}
          size="70%"
          className="absolute inset-0 m-auto pointer-events-none select-none text-primary/[0.03]"
          aria-hidden
        />
        <div className="relative px-3 py-2 lg:h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:h-full gap-3">
            {/* Left column: services, parts, notes */}
            <div className="lg:col-span-2 lg:overflow-y-auto lg:min-h-0">
              <div className="flex flex-col divide-y divide-border/40">
                <MemoizedServicesZone
                  services={services}
                  catalog={catalog}
                  locale={locale}
                  isFullScreen={isFullScreen}
                  onAddServiceOpenChange={onAddServiceOpenChange}
                  onEditPriceSave={onEditServicePriceSave}
                  onEditQtySave={onEditServiceQtySave}
                  t={t}
                  lastAddedServiceId={lastAddedServiceId}
                />

                <MemoizedPartsZone
                  parts={parts}
                  partsCatalog={partsCatalog}
                  locale={locale}
                  onAddPartOpenChange={onAddPartOpenChange}
                  onEditPriceSave={onEditPartPriceSave}
                  onEditQtySave={onEditPartQtySave}
                  t={t}
                  lastAddedPartId={lastAddedPartId}
                />

                {orgId && workOrderId ? (
                  <MemoizedNotesZone
                    complaint={complaint}
                    diagnosis={diagnosis}
                    notes={notes}
                    orgId={orgId}
                    workOrderId={workOrderId}
                    onUpdated={onNotesUpdated}
                    t={t}
                  />
                ) : null}
                {/* Opened date */}
                {wo.created_at && (
                  <div className="flex items-center justify-end pt-1">
                    <span className="text-[10px] text-muted-foreground/50">
                      {t("openedDate", {
                        date: new Date(wo.created_at).toLocaleDateString(),
                      })}
                    </span>
                  </div>
                )}
                {/* Sticky price summary — floats at bottom of scroll */}
                <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/40 -mx-3 px-3 py-2 z-10">
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
                    serviceCount={services.length}
                    partCount={parts.length}
                    discountTotal={discountTotal}
                    taxRate={taxRate}
                    nuatEnabled={nuatEnabled}
                    locale={locale}
                    t={t}
                  />
                </div>
              </div>
            </div>

            {/* Right column: timeline */}
            <div className="flex flex-col gap-3 lg:border-l lg:border-border/40 lg:pl-4 lg:overflow-y-auto lg:min-h-0">
              <MemoizedTimelineZone
                statusHistory={statusHistory}
                serviceHistory={serviceHistory}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <DrawerFooter
        wo={wo}
        invoicePublicToken={invoicePublicToken}
        saving={saving}
        pendingAction={pendingAction}
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
